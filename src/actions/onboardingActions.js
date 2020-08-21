// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { ethers } from 'ethers';
import get from 'lodash.get';
import { NavigationActions } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { ImageCacheManager } from 'react-native-cached-image';
import isEmpty from 'lodash.isempty';

// constants
import {
  GENERATING,
  UPDATE_WALLET_STATE,
  REGISTERING,
  USERNAME_EXISTS,
  USERNAME_OK,
  CHECKING_USERNAME,
  SET_API_USER,
  INAPPROPRIATE_USERNAME,
  INVALID_USERNAME,
  DECRYPTED,
} from 'constants/walletConstants';
import {
  APP_FLOW,
  NEW_WALLET,
  HOME,
  REFERRAL_INCOMING_REWARD,
  RECOVERY_PORTAL_WALLET_RECOVERY_STARTED,
} from 'constants/navigationConstants';
import { UPDATE_ASSETS, UPDATE_BALANCES } from 'constants/assetsConstants';
import { RESET_APP_SETTINGS } from 'constants/appSettingsConstants';
import { PENDING, REGISTERED, SET_USER } from 'constants/userConstants';
import { SET_HISTORY } from 'constants/historyConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { SET_COLLECTIBLES_TRANSACTION_HISTORY, UPDATE_COLLECTIBLES } from 'constants/collectiblesConstants';
import { RESET_SMART_WALLET } from 'constants/smartWalletConstants';
import { RESET_PAYMENT_NETWORK } from 'constants/paymentNetworkConstants';
import { UPDATE_BADGES } from 'constants/badgesConstants';
import { SET_USER_SETTINGS } from 'constants/userSettingsConstants';
import { SET_USER_EVENTS } from 'constants/userEventsConstants';

// utils
import { generateMnemonicPhrase } from 'utils/wallet';
import { delay } from 'utils/common';
import { updateOAuthTokensCB } from 'utils/oAuth';

// services
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { getExchangeRates } from 'services/assets';
import { firebaseMessaging } from 'services/firebase';
import smartWalletService from 'services/smartWallet';

// actions
import {
  importSmartWalletAccountsAction,
  managePPNInitFlagAction,
} from 'actions/smartWalletActions';
import { saveDbAction } from 'actions/dbActions';
import {
  checkForWalletBackupToastAction,
  encryptAndSaveWalletAction,
  generateWalletMnemonicAction,
} from 'actions/walletActions';
import { fetchSmartWalletTransactionsAction } from 'actions/historyActions';
import { logEventAction } from 'actions/analyticsActions';
import { setAppThemeAction } from 'actions/appSettingsActions';
import { fetchBadgesAction } from 'actions/badgesActions';
import { getWalletsCreationEventsAction } from 'actions/userEventsActions';
import { loadFeatureFlagsAction } from 'actions/featureFlagsActions';
import { setRatesAction } from 'actions/ratesActions';
import { resetAppState } from 'actions/authActions';
import { fetchReferralRewardAction } from 'actions/referralsActions';
import { checkIfRecoveredSmartWalletFinishedAction } from 'actions/recoveryPortalActions';
import { checkIfKeyBasedWalletHasPositiveBalanceAction } from 'actions/keyBasedAssetTransferActions';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';


const storage = Storage.getInstance('db');

export const getTokenWalletAndRegister = async (
  privateKey: string,
  api: SDKWrapper,
  user?: Object,
  dispatch: Dispatch,
  recover?: {
    accountAddress: string,
    deviceAddress: string,
  },
): Promise<Object> => {
  // we us FCM notifications so we must register for FCM, not regular native Push-Notifications
  await firebaseMessaging.registerForRemoteNotifications().catch(() => {});
  await firebaseMessaging.requestPermission().catch(() => {});
  const fcmToken = await firebaseMessaging.getToken().catch(() => null);

  if (fcmToken) await Intercom.sendTokenToIntercom(fcmToken).catch(() => null);

  const sdkWallet: Object = await api.registerOnAuthServer(privateKey, fcmToken, user?.username, recover);

  const registrationSucceed = !sdkWallet.error && sdkWallet.walletId;
  const userInfo = registrationSucceed ? await api.userInfo(sdkWallet.walletId) : {};
  const userState = !isEmpty(userInfo) ? REGISTERED : PENDING;

  if (userState === REGISTERED) {
    dispatch(saveDbAction('user', { user: userInfo }, true));
  }

  const oAuthTokens = {
    refreshToken: sdkWallet.refreshToken,
    accessToken: sdkWallet.accessToken,
  };

  const updateOAuth = updateOAuthTokensCB(dispatch);
  await updateOAuth(oAuthTokens);

  dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });
  dispatch({
    type: SET_USER,
    payload: {
      user: userInfo,
      state: userState,
    },
  });

  if (registrationSucceed) {
    dispatch(logEventAction('wallet_created'));
  } else {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: sdkWallet.reason,
    });
  }

  // invalidate image cache
  ImageCacheManager().clearCache().catch(() => null);

  return Promise.resolve({
    sdkWallet,
    userInfo,
    userState,
    fcmToken,
    registrationSucceed,
    oAuthTokens,
  });
};

export const finishRegistration = async ({
  api,
  dispatch,
  userInfo,
  privateKey,
}: {
  api: SDKWrapper,
  dispatch: Dispatch,
  userInfo: Object, // TODO: add back-end authenticated user model (not people related ApiUser),
  privateKey: string,
}) => {
  // set API username (local method)
  api.setUsername(userInfo.username);

  // get & store initial assets
  const initialAssets = await api.fetchInitialAssets(userInfo.walletId);
  const rates = await getExchangeRates(Object.keys(initialAssets));
  dispatch(setRatesAction(rates));

  // create smart wallet account only for new wallets
  await smartWalletService.reset();
  await dispatch(importSmartWalletAccountsAction(privateKey));

  dispatch(fetchBadgesAction(false));

  dispatch(loadFeatureFlagsAction());

  await dispatch(fetchSmartWalletTransactionsAction());

  dispatch(managePPNInitFlagAction());

  await dispatch({
    type: UPDATE_WALLET_STATE,
    payload: DECRYPTED,
  });

  dispatch(fetchReferralRewardAction());
};

export const navigateToAppFlow = (showIncomingReward?: boolean) => {
  const navigateToHomeScreen = NavigationActions.navigate({
    routeName: APP_FLOW,
    params: {},
    action: NavigationActions.navigate({ routeName: HOME }),
  });

  const navigateToIncomingRewardScreen = NavigationActions.navigate({
    routeName: APP_FLOW,
    params: {},
    action: NavigationActions.navigate({ routeName: REFERRAL_INCOMING_REWARD }),
  });

  if (showIncomingReward) {
    navigate(navigateToIncomingRewardScreen);
  } else {
    navigate(navigateToHomeScreen);
  }
};

export const registerWalletAction = (enableBiometrics?: boolean, themeToStore?: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const currentState = getState();
    const {
      onboarding: {
        mnemonic: { original: mnemonicPhrase },
        pin,
        importedWallet,
        apiUser,
      },
      backupStatus: {
        isBackedUp,
        isImported,
        isRecoveryPending,
      },
    } = currentState.wallet;

    // STEP 0: Clear local storage and reset app state except env if setup
    const env = await storage.get('environment');
    if (isImported) {
      await resetAppState();
    } else {
      await storage.removeAll();
    }
    if (env) {
      await storage.save('environment', env, true);
    }

    dispatch({ type: UPDATE_ACCOUNTS, payload: [] });
    dispatch({ type: UPDATE_ASSETS, payload: {} });
    dispatch({ type: RESET_APP_SETTINGS, payload: {} });

    // manage theme as appSettings gets overwritten
    if (themeToStore) dispatch(setAppThemeAction(themeToStore));

    dispatch({ type: SET_HISTORY, payload: {} });
    dispatch({ type: UPDATE_BALANCES, payload: {} });
    dispatch({ type: UPDATE_COLLECTIBLES, payload: {} });
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: {} });
    dispatch({ type: UPDATE_BADGES, payload: [] });
    dispatch({ type: RESET_SMART_WALLET });
    dispatch({ type: RESET_PAYMENT_NETWORK });
    dispatch({ type: SET_USER_SETTINGS, payload: {} });
    dispatch({ type: SET_USER_EVENTS, payload: [] });

    // STEP 1: navigate to the new wallet screen
    navigate(NavigationActions.navigate({ routeName: NEW_WALLET }));
    await delay(50);

    // STEP 2: check if wallet was imported or create it from the mnemonic phrase otherwise
    let wallet = importedWallet;
    if (!wallet) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: GENERATING,
      });
      await delay(50);
      wallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);
    }

    // STEP 3: encrypt the wallet
    const backupStatus = { isImported: !!importedWallet, isBackedUp, isRecoveryPending };
    await dispatch(encryptAndSaveWalletAction(pin, wallet, backupStatus, enableBiometrics));
    dispatch(saveDbAction('app_settings', { appSettings: { wallet: +new Date() } }));

    // checks if wallet import is pending and in this state we don't want to auth any users yet
    if (isRecoveryPending) {
      navigate(NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({ routeName: RECOVERY_PORTAL_WALLET_RECOVERY_STARTED }),
      }));
      dispatch(checkIfRecoveredSmartWalletFinishedAction(wallet));
      return;
    }

    // STEP 4: Initialize SDK and register user
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: REGISTERING,
    });

    const user = apiUser.username ? { username: apiUser.username } : {};
    dispatch(saveDbAction('user', { user }));

    api.init();
    const {
      userInfo,
      registrationSucceed,
      oAuthTokens,
    } = await getTokenWalletAndRegister(wallet.privateKey, api, user, dispatch);

    if (!registrationSucceed) { return; }

    // re-init API with OAuth update callback
    const updateOAuth = updateOAuthTokensCB(dispatch);
    api.init(updateOAuth, oAuthTokens);
    // STEP 5: finish registration
    await finishRegistration({
      api,
      dispatch,
      userInfo,
      privateKey: wallet.privateKey,
    });

    // STEP 6: add wallet created / imported events
    dispatch(getWalletsCreationEventsAction());

    // STEP 7: check if user ir referred to install the app
    const referralToken = get(getState(), 'referrals.referralToken');

    // STEP 8: check if wallet backup warning toast needed
    dispatch(checkForWalletBackupToastAction());

    // STEP 9: if wallet is imported let's check its balance for key based assets migration
    if (backupStatus.isImported) dispatch(checkIfKeyBasedWalletHasPositiveBalanceAction());

    // STEP 10: all done, navigate to the home screen or incoming reward screen
    navigateToAppFlow(!!referralToken);
  };
};

/*
  We call this action in various cases when we fail to register user wallet:
  1) during import
  2) during new wallet creation
  3) when user re-opened the app and sees RetryApiRegistration screen
 */
export const registerOnBackendAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      wallet: {
        data: walletData,
        onboarding: {
          apiUser,
          privateKey,
          importedWallet,
        },
      },
    } = getState();
    const walletPrivateKey = get(importedWallet, 'privateKey') || privateKey || get(walletData, 'privateKey');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: REGISTERING,
    });
    let { user = {} } = await storage.get('user');
    if (apiUser.username) {
      user = { ...apiUser };
    }
    await delay(1000);

    const { registrationSucceed, userInfo } = await getTokenWalletAndRegister(
      walletPrivateKey,
      api,
      user,
      dispatch,
    );
    if (!registrationSucceed) return;

    dispatch(logEventAction('user_created'));

    await finishRegistration({
      api,
      dispatch,
      userInfo,
      privateKey: walletPrivateKey,
    });

    dispatch(checkForWalletBackupToastAction());
    const referralToken = get(getState(), 'referrals.referralToken');

    navigateToAppFlow(!!referralToken);
  };
};

export const validateUserDetailsAction = ({ username }: Object) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const currentState = getState();
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: CHECKING_USERNAME,
    });
    const { mnemonic } = currentState.wallet.onboarding;
    const mnemonicPhrase = generateMnemonicPhrase(mnemonic.original);
    dispatch(generateWalletMnemonicAction(mnemonicPhrase));
    await delay(200);

    api.init();
    // TODO: add back-end authenticated user model (not people related ApiUser)
    const apiUser: Object = await api.usernameSearch(username);
    const usernameExists = apiUser.username === username;
    const inappropriateUsername = apiUser.status === 400 && apiUser.message === INAPPROPRIATE_USERNAME;
    let usernameStatus = usernameExists ? USERNAME_EXISTS : USERNAME_OK;
    if (apiUser.status === 400 && apiUser.message === INAPPROPRIATE_USERNAME) {
      usernameStatus = INVALID_USERNAME;
    }

    dispatch({
      type: SET_API_USER,
      payload: usernameExists || inappropriateUsername ? apiUser : { username },
    });
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: usernameStatus,
    });
  };
};
