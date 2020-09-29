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
import { NavigationActions } from 'react-navigation';
import Intercom from 'react-native-intercom';
import t from 'translations/translate';

// constants
import { SET_WALLET, UPDATE_WALLET_BACKUP_STATUS } from 'constants/walletConstants';
import {
  APP_FLOW,
  NEW_WALLET,
  HOME,
  REFERRAL_INCOMING_REWARD,
  NEW_PROFILE,
  RECOVERY_PORTAL_WALLET_RECOVERY_STARTED,
} from 'constants/navigationConstants';
import { SET_USER } from 'constants/userConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import {
  RESET_ONBOARDING,
  SET_IMPORTING_WALLET,
  SET_ONBOARDING_ERROR,
  SET_ONBOARDING_PIN_CODE,
  SET_ONBOARDING_USER,
  SET_ONBOARDING_WALLET,
  SET_REGISTERING_USER,
} from 'constants/onboardingConstants';

// components
import Toast from 'components/Toast';

// utils
import { generateMnemonicPhrase } from 'utils/wallet';
import { isCaseInsensitiveMatch, reportLog } from 'utils/common';
import { updateOAuthTokensCB } from 'utils/oAuth';

// services
import { navigate } from 'services/navigation';
import { getExchangeRates } from 'services/assets';
import { firebaseMessaging } from 'services/firebase';

// actions
import { importSmartWalletAccountsAction, managePPNInitFlagAction } from 'actions/smartWalletActions';
import { saveDbAction } from 'actions/dbActions';
import { checkForWalletBackupToastAction, encryptAndSaveWalletAction } from 'actions/walletActions';
import { fetchSmartWalletTransactionsAction } from 'actions/historyActions';
import { logEventAction } from 'actions/analyticsActions';
import { fetchBadgesAction } from 'actions/badgesActions';
import { getWalletsCreationEventsAction } from 'actions/userEventsActions';
import { loadFeatureFlagsAction } from 'actions/featureFlagsActions';
import { setRatesAction } from 'actions/ratesActions';
import { resetAppServicesAction, resetAppStateAction } from 'actions/authActions';
import { fetchReferralRewardAction } from 'actions/referralsActions';
import { checkIfKeyBasedWalletHasPositiveBalanceAction } from 'actions/keyBasedAssetTransferActions';
import { checkAndFinishSmartWalletRecoveryAction } from 'actions/recoveryPortalActions';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';


export const setupUserAction = (username: string, recoveryData?: Object) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch({ type: SET_REGISTERING_USER, payload: true });

    const {
      wallet: { data: wallet },
      session: { data: { isOnline } },
    } = getState();

    // save for future onboarding retry in case anything fails or is offline
    let userInfo = { username };
    await dispatch(saveDbAction('user', { user: userInfo }, true));

    const privateKey = wallet?.privateKey;
    if (!privateKey) {
      reportLog('setupUserAction failed: no privateKey');
      return;
    }

    if (isOnline) {
      api.init();
      // we us FCM notifications so we must register for FCM, not regular native Push-Notifications
      await firebaseMessaging.registerForRemoteNotifications().catch(() => null);
      await firebaseMessaging.requestPermission().catch(() => null);
      const fcmToken = await firebaseMessaging.getToken().catch(() => null);

      if (fcmToken) await Intercom.sendTokenToIntercom(fcmToken).catch(() => null);

      const sdkWallet: Object = await api.registerOnAuthServer(privateKey, fcmToken, username, recoveryData);

      if (!!sdkWallet?.error || !sdkWallet?.walletId) {
        const error = sdkWallet?.reason || t('auth:error.registrationApiFailedWithNoReason');
        reportLog('setupUserAction user registration failed', { error });
        dispatch({ type: SET_ONBOARDING_ERROR, payload: error });
        return;
      }

      userInfo = await api.userInfo(sdkWallet.walletId);

      // save updated
      dispatch(saveDbAction('user', { user: userInfo }, true));

      api.setUsername(userInfo.username);

      const oAuthTokens = {
        refreshToken: sdkWallet.refreshToken,
        accessToken: sdkWallet.accessToken,
      };

      const updateOAuth = updateOAuthTokensCB(dispatch);
      api.init(updateOAuth, oAuthTokens);
      await updateOAuth(oAuthTokens);

      dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });

      dispatch(logEventAction('wallet_created'));
    }

    dispatch({ type: SET_USER, payload: userInfo });

    dispatch({ type: SET_REGISTERING_USER, payload: false });
  };
};

export const setupWalletAction = (enableBiometrics?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      onboarding: {
        pinCode,
        wallet: importedWallet, // wallet was already added in import step
        isPortalRecovery,
      },
    } = getState();

    if (!pinCode) {
      reportLog('setupWalletAction failed: no pinCode');
      return;
    }

    const isImported = !!importedWallet;

    // will return new mnemonic if importedWallet is not present
    const mnemonic = importedWallet?.mnemonic || generateMnemonicPhrase();

    // create wallet object
    const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic);

    // raw private key will be removed from reducer once registration finishes
    const { address, privateKey } = ethersWallet;
    dispatch({ type: SET_WALLET, payload: { address, privateKey } });

    const isRecoveryPending = !!isPortalRecovery;
    const backupStatus = { isImported, isBackedUp: !isImported, isRecoveryPending };

    // dispatch to reducer only, will be stored with encryptAndSaveWalletAction
    dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: backupStatus });

    // encrypt and store
    await dispatch(encryptAndSaveWalletAction(pinCode, ethersWallet, backupStatus, enableBiometrics));

    dispatch(saveDbAction('app_settings', { appSettings: { wallet: +new Date() } }));
  };
};

export const setupAppServicesAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      wallet: { backupStatus, data: walletData },
      user: { data: { walletId } },
      session: { data: { isOnline } },
    } = getState();

    const privateKey = walletData?.privateKey;
    if (!privateKey) {
      reportLog('setupAppServicesAction failed: no privateKey');
      return;
    }

    if (isOnline) {
      dispatch(loadFeatureFlagsAction());

      // user might not be registered at this point
      if (walletId) {
        const initialAssets = await api.fetchInitialAssets(walletId);
        const rates = await getExchangeRates(Object.keys(initialAssets));
        dispatch(setRatesAction(rates));
        dispatch(fetchBadgesAction(false));
        dispatch(fetchReferralRewardAction());
      }

      // create smart wallet account only for new wallets
      await dispatch(importSmartWalletAccountsAction(privateKey));
      await dispatch(fetchSmartWalletTransactionsAction());
      dispatch(managePPNInitFlagAction());

      // if wallet was imported let's check its balance for key based assets migration
      if (backupStatus.isImported) {
        dispatch(checkIfKeyBasedWalletHasPositiveBalanceAction());
      }
    }

    // add wallet created / imported events
    dispatch(getWalletsCreationEventsAction());

    // check if wallet backup warning toast needed
    dispatch(checkForWalletBackupToastAction());
  };
};

export const finishOnboardingAction = (retry?: boolean, recoveryData?: Object) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // reset on retry
    if (retry) {
      dispatch({ type: SET_ONBOARDING_ERROR, payload: null });
    }

    const {
      onboarding: { user: onboardingUser },
      user: { data: user },
      wallet: { backupStatus: { isRecoveryPending } },
    } = getState();

    // either retry during onboarding or previously stored username during onboarding
    if (!user?.walletId) await dispatch(setupUserAction(onboardingUser?.username || user.username, recoveryData));

    await dispatch(setupAppServicesAction());

    dispatch({ type: RESET_ONBOARDING });

    // reset if recovery was pending as it's successful recover by this step
    if (isRecoveryPending) {
      dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: { isRecoveryPending: false } });
      dispatch(saveDbAction('wallet', { wallet: { backupStatus: { isRecoveryPending: false } } }));
    }

    // check if user was referred to install the app and navigate accordingly
    const routeName = getState()?.referrals?.referralToken ? REFERRAL_INCOMING_REWARD : HOME;
    navigate(NavigationActions.navigate({
      routeName: APP_FLOW,
      params: {},
      action: NavigationActions.navigate({ routeName }),
    }));
  };
};

export const beginOnboardingAction = (enableBiometrics?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // pass current onboarding, referrals and session network state to keep after redux state reset
    const {
      onboarding,
      referrals,
      session: { data: { isOnline } },
    } = getState();

    dispatch(resetAppStateAction({
      onboarding,
      referrals,
      session: { data: { isOnline } },
    }));

    navigate(NavigationActions.navigate({ routeName: NEW_WALLET }));

    await dispatch(resetAppServicesAction());

    await dispatch(setupWalletAction(enableBiometrics));

    // checks if wallet import is pending and in this state we don't want to auth any users yet
    if (onboarding.isPortalRecovery) {
      navigate(NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({ routeName: RECOVERY_PORTAL_WALLET_RECOVERY_STARTED }),
      }));
      dispatch(checkAndFinishSmartWalletRecoveryAction());
      return;
    }

    dispatch(finishOnboardingAction());
  };
};

export const importWalletFromMnemonicAction = (mnemonicInput: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch({ type: SET_IMPORTING_WALLET });

    let importedWallet;
    try {
      importedWallet = ethers.Wallet.fromMnemonic(mnemonicInput);
    } catch (e) {
      // keep error unsent in case it contains mnemonic phrase
    }

    if (!importedWallet) {
      dispatch({ type: SET_ONBOARDING_ERROR, payload: t('auth:error.incorrectBackupPhrase.default') });
      return;
    }

    api.init();
    const registeredWalletUser = await api.validateAddress(importedWallet.address);
    if (registeredWalletUser?.walletId) {
      const {
        walletId,
        username,
        profileImage,
      } = registeredWalletUser;
      dispatch({ type: SET_ONBOARDING_USER, payload: { walletId, username, profileImage } });
    }

    const {
      mnemonic: { phrase: mnemonic },
      address,
      privateKey,
    } = importedWallet;
    dispatch({ type: SET_ONBOARDING_WALLET, payload: { mnemonic, address, privateKey } });

    dispatch(logEventAction('wallet_imported', { method: 'Words Phrase' }));

    navigate(NavigationActions.navigate({ routeName: NEW_PROFILE }));
  };
};

export const resetUsernameCheckAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_ONBOARDING_USER, payload: null });
    dispatch({ type: SET_ONBOARDING_ERROR, payload: null });
  };
};

export const resetOnboardingAction = () => ({ type: RESET_ONBOARDING });

export const resetOnboardingAndNavigateAction = (routeName: string) => {
  return (dispatch: Dispatch) => {
    dispatch(resetOnboardingAction());
    navigate(NavigationActions.navigate({ routeName }));
  };
};

export const checkUsernameAvailabilityAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch(resetUsernameCheckAction());

    // if user is offline then proceed with local registration
    if (!getState()?.session?.data?.isOnline) {
      Toast.show({
        message: t('auth:toast.userIsOffline'),
        emoji: 'satellite_antenna',
      });
      dispatch({
        type: SET_ONBOARDING_USER,
        payload: { username },
      });
      return;
    }

    api.init();
    const result: {
      status?: number,
      username?: string,
      message?: string,
    } = await api.usernameSearch(username);

    const usernameTaken = isCaseInsensitiveMatch(result?.username, username);

    if (result?.status === 400 || usernameTaken) {
      const errorMessage = result?.message || t('auth:error.invalidUsername.default');
      dispatch({
        type: SET_ONBOARDING_ERROR,
        payload: usernameTaken ? t('auth:error.invalidUsername.taken') : errorMessage,
      });
      return;
    }

    dispatch({
      type: SET_ONBOARDING_USER,
      payload: { username },
    });
  };
};

export const setOnboardingPinCodeAction = (pinCode: string) => ({
  type: SET_ONBOARDING_PIN_CODE,
  payload: pinCode,
});

export const resetWalletImportErrorAction = () => ({ type: SET_ONBOARDING_ERROR, payload: null });
