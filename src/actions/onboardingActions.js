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
import firebase from 'react-native-firebase';
import Intercom from 'react-native-intercom';
import { ImageCacheManager } from 'react-native-cached-image';
import isEmpty from 'lodash.isempty';

// constants
import {
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
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
import { APP_FLOW, NEW_WALLET, HOME } from 'constants/navigationConstants';
import { SET_INITIAL_ASSETS, UPDATE_ASSETS, UPDATE_BALANCES } from 'constants/assetsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { TYPE_ACCEPTED, TYPE_RECEIVED, UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { RESET_APP_SETTINGS, USER_JOINED_BETA_SETTING } from 'constants/appSettingsConstants';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { PENDING, REGISTERED, UPDATE_USER } from 'constants/userConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';
import { SET_HISTORY } from 'constants/historyConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { SET_COLLECTIBLES_TRANSACTION_HISTORY, UPDATE_COLLECTIBLES } from 'constants/collectiblesConstants';
import { RESET_SMART_WALLET } from 'constants/smartWalletConstants';
import { RESET_PAYMENT_NETWORK } from 'constants/paymentNetworkConstants';
import { UPDATE_BADGES } from 'constants/badgesConstants';
import { SET_USER_SETTINGS } from 'constants/userSettingsConstants';
import { SET_FEATURE_FLAGS } from 'constants/featureFlagsConstants';
import { WALLET_IMPORT_EVENT } from 'constants/userEventsConstants';

// utils
import { generateMnemonicPhrase, getSaltedPin, normalizeWalletAddress } from 'utils/wallet';
import { delay, uniqBy } from 'utils/common';
import { toastWalletBackup } from 'utils/toasts';
import { updateOAuthTokensCB } from 'utils/oAuth';
import { parseNotificationMessage } from 'utils/notifications';

// services
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { getExchangeRates } from 'services/assets';

// actions
import { signalInitAction } from 'actions/signalClientActions';
import {
  initSmartWalletSdkAction,
  importSmartWalletAccountsAction,
  managePPNInitFlagAction,
} from 'actions/smartWalletActions';
import { saveDbAction } from 'actions/dbActions';
import { generateWalletMnemonicAction } from 'actions/walletActions';
import { updateConnectionKeyPairs } from 'actions/connectionKeyPairActions';
import { initDefaultAccountAction } from 'actions/accountsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { logEventAction } from 'actions/analyticsActions';
import { setAppThemeAction, changeUseBiometricsAction, updateAppSettingsAction } from 'actions/appSettingsActions';
import { fetchBadgesAction } from 'actions/badgesActions';
import { addWalletCreationEventAction, getWalletsCreationEventsAction } from 'actions/userEventsActions';
import { loadFeatureFlagsAction } from 'actions/featureFlagsActions';
import { labelUserAsLegacyAction } from 'actions/userActions';
import { setRatesAction } from 'actions/ratesActions';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { SignalCredentials } from 'models/Config';
import type SDKWrapper from 'services/api';

const storage = Storage.getInstance('db');

const getTokenWalletAndRegister = async (
  privateKey: string,
  api: SDKWrapper,
  user: Object,
  dispatch: Dispatch,
) => {
  await firebase.messaging().requestPermission().catch(() => { });
  const fcmToken = await firebase.messaging().getToken().catch(() => { });

  await Intercom.sendTokenToIntercom(fcmToken).catch(() => null);
  const sdkWallet: Object = await api.registerOnAuthServer(privateKey, fcmToken, user.username);
  const registrationSucceed = !sdkWallet.error;
  const userInfo = await api.userInfo(sdkWallet.walletId);
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
    type: UPDATE_USER,
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

  return {
    sdkWallet,
    userInfo,
    userState,
    fcmToken,
    registrationSucceed,
    oAuthTokens,
  };
};

const finishRegistration = async ({
  api,
  dispatch,
  getState,
  userInfo,
  mnemonic,
  privateKey,
  address,
  isImported,
}: {
  api: SDKWrapper,
  dispatch: Dispatch,
  getState: GetState,
  userInfo: Object, // TODO: add back-end authenticated user model (not people related ApiUser)
  mnemonic: ?string,
  privateKey: string,
  address: string,
  isImported: boolean,
}) => {
  // set API username (local method)
  api.setUsername(userInfo.username);

  // create default key-based account if needed
  await dispatch(initDefaultAccountAction(address, userInfo.walletId, false));

  // get & store initial assets
  const initialAssets = await api.fetchInitialAssets(userInfo.walletId);
  const rates = await getExchangeRates(Object.keys(initialAssets));
  dispatch(setRatesAction(rates));

  dispatch({
    type: SET_INITIAL_ASSETS,
    payload: {
      accountId: address,
      assets: initialAssets,
    },
  });

  const assets = { [address]: initialAssets };
  dispatch(saveDbAction('assets', { assets }, true));

  dispatch(fetchBadgesAction(false));

  // user might be already joined to beta program before
  if (isImported && userInfo.betaProgramParticipant) {
    dispatch(updateAppSettingsAction(USER_JOINED_BETA_SETTING, true));
  }

  dispatch(loadFeatureFlagsAction(userInfo));

  const smartWalletFeatureEnabled = get(getState(), 'featureFlags.data.SMART_WALLET_ENABLED', false);
  if (smartWalletFeatureEnabled) {
    // create smart wallet account only for new wallets
    const createNewAccount = !isImported;
    await dispatch(initSmartWalletSdkAction(privateKey));
    await dispatch(importSmartWalletAccountsAction(privateKey, createNewAccount, initialAssets));
  }

  await dispatch(fetchTransactionsHistoryAction());
  dispatch(labelUserAsLegacyAction());

  if (smartWalletFeatureEnabled) {
    dispatch(managePPNInitFlagAction());
  }

  await dispatch(updateConnectionKeyPairs(mnemonic, privateKey, userInfo.walletId));

  // restore access tokens
  await dispatch(restoreAccessTokensAction(userInfo.walletId)); // eslint-disable-line

  await dispatch({
    type: UPDATE_WALLET_STATE,
    payload: DECRYPTED,
  });
};

const navigateToAppFlow = (isWalletBackedUp: boolean) => {
  toastWalletBackup(isWalletBackedUp);

  const navigateToAssetsAction = NavigationActions.navigate({
    routeName: APP_FLOW,
    params: {},
    action: NavigationActions.navigate({ routeName: HOME }),
  });
  navigate(navigateToAssetsAction);
};

export const registerWalletAction = (enableBiometrics?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const currentState = getState();
    const {
      mnemonic,
      pin,
      importedWallet,
      apiUser,
    } = currentState.wallet.onboarding;

    const mnemonicPhrase = mnemonic.original;
    const { isBackedUp, isImported } = currentState.wallet.backupStatus;

    // STEP 0: Clear local storage and reset app state
    await storage.removeAll();
    dispatch({ type: UPDATE_ACCOUNTS, payload: [] });
    dispatch({ type: UPDATE_CONTACTS, payload: [] });
    dispatch({ type: UPDATE_INVITATIONS, payload: [] });
    dispatch({ type: UPDATE_ASSETS, payload: {} });
    dispatch({ type: RESET_APP_SETTINGS, payload: {} });
    dispatch(setAppThemeAction()); // as appSettings gets overwritten
    dispatch({ type: UPDATE_ACCESS_TOKENS, payload: [] });
    dispatch({ type: SET_HISTORY, payload: {} });
    dispatch({ type: UPDATE_BALANCES, payload: {} });
    dispatch({ type: UPDATE_COLLECTIBLES, payload: {} });
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: {} });
    dispatch({ type: UPDATE_BADGES, payload: [] });
    dispatch({ type: RESET_SMART_WALLET });
    dispatch({ type: RESET_PAYMENT_NETWORK });
    dispatch({ type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: [] });
    dispatch({ type: UPDATE_CONNECTION_KEY_PAIRS, payload: [] });
    dispatch({ type: SET_USER_SETTINGS, payload: {} });
    dispatch({ type: SET_FEATURE_FLAGS, payload: {} });

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
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);
    const saltedPin = await getSaltedPin(pin, dispatch);
    const encryptedWallet = await wallet.RNencrypt(saltedPin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    dispatch(saveDbAction('wallet', {
      wallet: {
        ...encryptedWallet,
        backupStatus: { isImported: !!importedWallet, isBackedUp },
      },
    }));
    dispatch(saveDbAction('app_settings', { appSettings: { wallet: +new Date() } }));

    const user = apiUser.username ? { username: apiUser.username } : {};
    dispatch(saveDbAction('user', { user }));
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: {
        address: wallet.address,
      },
    });

    // STEP 4: Initialize SDK and register user
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: REGISTERING,
    });

    api.init();
    const {
      sdkWallet,
      userInfo,
      fcmToken,
      registrationSucceed,
      oAuthTokens,
    } = await getTokenWalletAndRegister(wallet.privateKey, api, user, dispatch);

    if (!registrationSucceed) { return; }

    const signalCredentials: SignalCredentials = {
      userId: sdkWallet.userId,
      username: user.username,
      walletId: sdkWallet.walletId,
      ethAddress: wallet.address,
      fcmToken,
      ...oAuthTokens,
    };

    await dispatch(signalInitAction(signalCredentials));

    // re-init API with OAuth update callback
    const updateOAuth = updateOAuthTokensCB(dispatch, signalCredentials);
    api.init(updateOAuth, oAuthTokens);

    // STEP 5: finish registration
    let finalMnemonic = mnemonicPhrase;
    if (importedWallet) {
      if (importedWallet.mnemonic) {
        finalMnemonic = importedWallet.mnemonic;
      } else {
        finalMnemonic = '';
      }
    }

    await finishRegistration({
      api,
      dispatch,
      getState,
      userInfo,
      address: normalizeWalletAddress(wallet.address),
      mnemonic: finalMnemonic,
      privateKey: wallet.privateKey,
      isImported,
    });

    // STEP 6: add wallet created / imported events
    dispatch(getWalletsCreationEventsAction());
    if (isImported) dispatch(addWalletCreationEventAction(WALLET_IMPORT_EVENT, +new Date() / 1000));

    if (enableBiometrics) await dispatch(changeUseBiometricsAction(true, wallet.privateKey, true));

    // STEP 7: all done, navigate to the home screen
    const isWalletBackedUp = isImported || isBackedUp;
    navigateToAppFlow(isWalletBackedUp);
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
          mnemonic,
          privateKey,
          importedWallet,
        },
        backupStatus: { isBackedUp, isImported },
      },
    } = getState();

    const walletMnemonic = get(importedWallet, 'mnemonic') || get(mnemonic, 'original') || get(walletData, 'mnemonic');
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
      getState,
      userInfo,
      address: normalizeWalletAddress(walletData.address),
      mnemonic: walletMnemonic,
      privateKey: walletPrivateKey,
      isImported,
    });

    const isWalletBackedUp = isImported || isBackedUp;
    navigateToAppFlow(isWalletBackedUp);
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

export const restoreAccessTokensAction = (walletId: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const restoredAccessTokens = [];
    const userAccessTokens = await api.fetchAccessTokens(walletId);

    // get connectionRequestedEvent & connectionAcceptedEvent notifications
    const types = [
      TYPE_RECEIVED,
      TYPE_ACCEPTED,
    ];
    // TODO: add back-end notification model?
    const rawNotifications = await api.fetchNotifications(walletId, types.join(' '));
    if (isEmpty(rawNotifications)) return;

    const notifications = rawNotifications
      .map(parseNotificationMessage)
      .map(({ senderUserData, type, createdAt }) => ({ ...senderUserData, type, createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);

    // split into groups
    let receivedConnectionRequests = notifications.filter(notification => notification.type === TYPE_RECEIVED);
    let sentConnectionRequests = notifications.filter(notification => notification.type === TYPE_ACCEPTED);

    // remove duplicates
    receivedConnectionRequests = uniqBy(receivedConnectionRequests, 'id');
    sentConnectionRequests = uniqBy(sentConnectionRequests, 'id');

    userAccessTokens.forEach(token => {
      // check in received connection requests
      let found = receivedConnectionRequests.find(({ id }) => id === token.contactId);

      // not found? check in sent connection requests
      if (!found) {
        found = sentConnectionRequests.find(({ id }) => id === token.contactId);
      }

      // can't find again? then skip this connection
      if (!found) return;

      restoredAccessTokens.push({
        myAccessToken: token.accessKey,
        userId: token.contactId,
        userAccessToken: found.connectionKey,
      });
    });
    await dispatch({
      type: UPDATE_ACCESS_TOKENS,
      payload: restoredAccessTokens,
    });
    await dispatch(saveDbAction('accessTokens', { accessTokens: restoredAccessTokens }, true));
  };
};
