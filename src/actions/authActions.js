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

import { Linking } from 'react-native';
import { NavigationActions } from 'react-navigation';
import merge from 'lodash.merge';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import Intercom from 'react-native-intercom';
import { ImageCacheManager } from 'react-native-cached-image';
import t from 'translations/translate';

// constants
import {
  SET_WALLET,
  SET_WALLET_ERROR,
  SET_WALLET_IS_DECRYPTING,
  RESET_WALLET_ERROR,
  SET_WALLET_IS_CHANGING_PIN,
} from 'constants/walletConstants';
import {
  APP_FLOW,
  AUTH_FLOW,
  ONBOARDING_FLOW,
  HOME,
  PIN_CODE_UNLOCK,
  LOGOUT_PENDING,
  RECOVERY_PORTAL_WALLET_RECOVERY_PENDING,
} from 'constants/navigationConstants';
import { SET_USERNAME, UPDATE_USER } from 'constants/userConstants';
import { RESET_APP_STATE } from 'constants/authConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// utils
import { delay, reportLog, reportOrWarn } from 'utils/common';
import { getSaltedPin, decryptWallet, constructWalletFromPrivateKey } from 'utils/wallet';
import { updateOAuthTokensCB, onOAuthTokensFailedCB } from 'utils/oAuth';
import { clearWebViewCookies } from 'utils/exchange';
import {
  setKeychainDataObject,
  resetKeychainDataObject,
  getWalletFromPkByPin,
  canLoginWithPkFromPin,
} from 'utils/keychain';
import { isSupportedBlockchain } from 'utils/blockchainNetworks';
import { findFirstSmartAccount, getActiveAccountType } from 'utils/accounts';
import { isTest } from 'utils/environment';

// services
import Storage from 'services/storage';
import smartWalletService from 'services/smartWallet';
import { navigate, getNavigationState, getNavigationPathAndParamsState } from 'services/navigation';
import { firebaseIid, firebaseCrashlytics, firebaseMessaging } from 'services/firebase';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';

// actions
import { saveDbAction } from './dbActions';
import { getWalletsCreationEventsAction } from './userEventsActions';
import { setupSentryAction } from './appActions';
import { initOnLoginSmartWalletAccountAction, setActiveAccountAction } from './accountsActions';
import {
  encryptAndSaveWalletAction,
  checkForWalletBackupToastAction,
  updatePinAttemptsAction,
} from './walletActions';
import { fetchSmartWalletTransactionsAction } from './historyActions';
import { setAppThemeAction, initialDeeplinkExecutedAction } from './appSettingsActions';
import { setActiveBlockchainNetworkAction } from './blockchainNetworkActions';
import { loadFeatureFlagsAction } from './featureFlagsActions';
import { getExchangeSupportedAssetsAction } from './exchangeActions';
import { fetchReferralRewardAction } from './referralsActions';
import { executeDeepLinkAction } from './deepLinkActions';
import {
  checkAndFinishSmartWalletRecoveryAction,
  checkRecoveredSmartWalletStateAction,
} from './recoveryPortalActions';
import { importSmartWalletAccountsAction } from './smartWalletActions';
import {
  checkIfKeyBasedWalletHasPositiveBalanceAction,
  checkKeyBasedAssetTransferTransactionsAction,
} from './keyBasedAssetTransferActions';


const storage = Storage.getInstance('db');

export const updateFcmTokenAction = (walletId: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const fcmToken = await firebaseMessaging.getToken().catch(e => {
      // We was unable to fetch the FCM token.
      reportLog(`Unable to fetch Firebase FCM token: ${e.message}`, e);

      return null;
    });
    if (!fcmToken) return;
    dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });
    Intercom.sendTokenToIntercom(fcmToken).catch(e => {
      // Unable to send the FCM token to Intercom
      reportLog(`Unable to send FCM token to Intercom: ${e.message}`, e);

      return null;
    });
    await api.updateFCMToken(walletId, fcmToken);
  };
};

/**
 * ### IMPORTANT ###
 * If you plan to use any method within loginAction that calls
 * Pillar Wallet SDK API please make sure you wait until it completes
 * as first method might also perform tokens refresh during the request
 */
export const loginAction = (
  pin: ?string,
  privateKey: ?string,
  onLoginSuccess: ?Function,
  useBiometrics?: ?boolean,
) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      appSettings: { data: { blockchainNetwork, useBiometrics: biometricsSetting, initialDeeplinkExecuted } },
      oAuthTokens: { data: oAuthTokens },
      session: { data: { isOnline } },
      accounts: { data: accounts },
    } = getState();

    dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: true } });

    try {
      let wallet;

      dispatch({ type: SET_WALLET_IS_DECRYPTING });

      const keychainLogin = await canLoginWithPkFromPin(!!biometricsSetting);
      if (pin && keychainLogin) {
        wallet = await getWalletFromPkByPin(pin);
      } else if (pin) {
        const { wallet: encryptedWallet } = await storage.get('wallet');
        await delay(100);
        const saltedPin = await getSaltedPin(pin, dispatch);
        wallet = await decryptWallet(encryptedWallet, saltedPin);
        // no further code will be executed if pin is wrong
        // migrate older users for keychain access OR fallback for biometrics login
        const keychainDataObject = {
          pin,
          privateKey: wallet.privateKey,
          mnemonic: wallet?.mnemonic?.phrase || '',
        };
        await setKeychainDataObject(keychainDataObject, useBiometrics);
      } else if (privateKey) {
        wallet = constructWalletFromPrivateKey(privateKey);
      } else {
        // nothing provided, invalid login
        throw new Error();
      }

      let { user = {} } = await storage.get('user');

      const decryptedPrivateKey = wallet?.privateKey;
      if (!decryptedPrivateKey) {
        reportLog('Unable to get wallet private key', { user });
        throw new Error();
      }

      // set username regardless user completed reg or not
      if (user?.username) {
        dispatch({ type: SET_USERNAME, payload: user.username });
      }

      const { address } = wallet;
      let unlockedWallet = { address };

      /**
       * if user isn't completely registered then put private key into state to complete registration,
       * this can happen due offline or web recovery portal onboarding
       */
      if (!user?.walletId) {
        unlockedWallet = { ...unlockedWallet, privateKey: decryptedPrivateKey };
      }

      // web recovery portal recovery pending, let's navigate accordingly
      if (getState().wallet.backupStatus.isRecoveryPending) {
        dispatch({ type: SET_WALLET, payload: unlockedWallet });
        navigate(NavigationActions.navigate({ routeName: RECOVERY_PORTAL_WALLET_RECOVERY_PENDING }));
        await smartWalletService.init(
          decryptedPrivateKey,
          (event) => dispatch(checkRecoveredSmartWalletStateAction(event)),
        );
        dispatch(checkAndFinishSmartWalletRecoveryAction());
        return;
      }

      // execute login success callback
      if (onLoginSuccess) {
        const rawPrivateKey = decryptedPrivateKey.indexOf('0x') === 0
          ? decryptedPrivateKey.slice(2)
          : decryptedPrivateKey;
        await onLoginSuccess(rawPrivateKey);
      }

      dispatch({ type: SET_WALLET, payload: unlockedWallet });

      // init smart wallet
      await dispatch(initOnLoginSmartWalletAccountAction(decryptedPrivateKey));

      const smartWalletAccount = findFirstSmartAccount(accounts);

      // key based wallet migration – switch to smart wallet if key based was active
      if (getActiveAccountType(accounts) !== ACCOUNT_TYPES.SMART_WALLET && smartWalletAccount) {
        await dispatch(setActiveAccountAction(smartWalletAccount.id));
      }

      /**
       * set Ethereum network as active if we disable feature flag
       * or end beta testing program while user has set BTC as active network
       */
      const revertToDefaultNetwork = !isSupportedBlockchain(blockchainNetwork);
      if (revertToDefaultNetwork || !blockchainNetwork) {
        dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
      }

      if (isOnline) {
        // Dispatch action to try and get the latest remote config values...
        dispatch(loadFeatureFlagsAction());

        // to get exchange supported assets in order to show only supported assets on exchange selectors
        // and show exchange button on supported asset screen only
        dispatch(getExchangeSupportedAssetsAction());

        // offline onboarded or very old user that doesn't have any smart wallet, let's create one and migrate safe
        if (!smartWalletAccount) {
          // this will import and set Smart Wallet as current active account
          await dispatch(importSmartWalletAccountsAction(decryptedPrivateKey));
        }

        dispatch(checkIfKeyBasedWalletHasPositiveBalanceAction());
        dispatch(checkKeyBasedAssetTransferTransactionsAction());
      }

      dispatch(checkForWalletBackupToastAction());

      // user is registered
      if (user?.walletId) {
        // oauth fallback method for expired access token
        const updateOAuth = updateOAuthTokensCB(dispatch);

        // oauth fallback method for all tokens expired or invalid
        const onOAuthTokensFailed = onOAuthTokensFailedCB(dispatch);

        // init API
        api.init(updateOAuth, oAuthTokens, onOAuthTokensFailed);

        // set API username (local method)
        api.setUsername(user.username);

        if (isOnline) {
          // make first api call which can also trigger OAuth fallback methods
          const userInfo = await api.userInfo(user.walletId);

          // update FCM
          dispatch(updateFcmTokenAction(user.walletId));

          // save updated user, just in case userInfo endpoint failed check if result is empty
          if (!isEmpty(userInfo)) {
            user = merge({}, user, userInfo);
            dispatch({ type: UPDATE_USER, payload: user });
            dispatch(saveDbAction('user', { user }, true));
          }

          dispatch(getWalletsCreationEventsAction());
          dispatch(fetchSmartWalletTransactionsAction());
          dispatch(fetchReferralRewardAction());

          firebaseCrashlytics.setUserId(user.username);
        }
      } else {
        api.init();
      }

      dispatch(updatePinAttemptsAction(false));

      if (!__DEV__) {
        dispatch(setupSentryAction(user, wallet));
      }

      // TODO: do we actually need getNavigationPathAndParamsState check at all?
      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams && !isTest) { // do not execute check on test instance
        reportLog('loginAction failed: no pathAndParams');
        return;
      }

      const { lastActiveScreen, lastActiveScreenParams } = getNavigationState();
      const navigateToLastActiveScreen = NavigationActions.navigate({
        // current active screen will be always AUTH_FLOW due to login/logout
        routeName: lastActiveScreen || HOME,
        params: lastActiveScreenParams,
      });

      const navigateToAppAction = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: navigateToLastActiveScreen,
      });

      if (!initialDeeplinkExecuted) {
        Linking.getInitialURL()
          .then(url => {
            if (url) dispatch(executeDeepLinkAction(url));
          })
          .catch(e => reportLog(`Could not get initial deeplink URL: ${e.message}`, e));
        dispatch(initialDeeplinkExecutedAction());
      }

      navigate(navigateToAppAction);
    } catch (e) {
      reportLog(`An error occurred whilst trying to complete auth actions: ${e.errorMessage}`, e);
      dispatch(updatePinAttemptsAction(true));
      dispatch({
        type: SET_WALLET_ERROR,
        payload: t('auth:error.invalidPin.default'),
      });
    }

    dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: false } });
  };
};

export const checkAuthAction = (
  pin: ?string,
  privateKey: ?string,
  onValidPin?: Function,
  withMnemonic: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { appSettings: { data: { useBiometrics } } } = getState();
    dispatch({ type: SET_WALLET_IS_DECRYPTING });
    try {
      let wallet;
      // fallback if biometrics check fails, or is rejected by user
      if (pin && useBiometrics) {
        const { wallet: encryptedWallet } = await storage.get('wallet');
        await delay(100);
        const saltedPin = await getSaltedPin(pin, dispatch);
        wallet = await decryptWallet(encryptedWallet, saltedPin);
      } else if (pin) {
        wallet = await getWalletFromPkByPin(pin, withMnemonic);
      } else if (privateKey) {
        wallet = constructWalletFromPrivateKey(privateKey);
      }
      if (wallet) {
        dispatch({
          type: SET_WALLET,
          payload: { address: wallet.address },
        });
        if (onValidPin) {
          onValidPin(pin, wallet);
        }
        return;
      }
    } catch (e) {
      reportOrWarn('Error constructing the wallet object', e, 'error');
    }
    dispatch({
      type: SET_WALLET_ERROR,
      payload: t('auth:error.invalidPin.default'),
    });
  };
};

export const changePinAction = (newPin: string, currentPin: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_WALLET_IS_CHANGING_PIN, payload: true });

    const { wallet: encryptedWallet } = await storage.get('wallet');
    const { appSettings: { data: { useBiometrics } } } = getState();
    const backupStatus = get(encryptedWallet, 'backupStatus', {});


    dispatch({ type: SET_WALLET_IS_DECRYPTING, payload: true });

    const currentSaltedPin = await getSaltedPin(currentPin, dispatch);
    const wallet = await decryptWallet(encryptedWallet, currentSaltedPin);

    dispatch({ type: SET_WALLET_IS_DECRYPTING, payload: false });

    await dispatch(encryptAndSaveWalletAction(newPin, wallet, backupStatus, useBiometrics));

    dispatch({ type: SET_WALLET_IS_CHANGING_PIN, payload: false });
  };
};

export const resetIncorrectPasswordAction = () => ({ type: RESET_WALLET_ERROR });

export const lockScreenAction = (onLoginSuccess?: Function, errorMessage?: string) => {
  return () => {
    navigate(NavigationActions.navigate({
      routeName: AUTH_FLOW,
      params: {},
      action: NavigationActions.navigate({
        routeName: PIN_CODE_UNLOCK,
        params: {
          onLoginSuccess,
          errorMessage,
          forcePin: true,
        },
      }),
    }));
  };
};

export const resetAppStateAction = (stateAfterReset: Object) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const savedThemeType = getState().appSettings?.data?.themeType;

    dispatch({ type: RESET_APP_STATE, payload: stateAfterReset });

    // set and store theme after reset
    if (savedThemeType === DARK_THEME) {
      dispatch(setAppThemeAction(DARK_THEME));
    }
  };
};

export const resetAppServicesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // reset intercom user
    Intercom.logout().catch(() => null);

    // reset firebase fcm
    await firebaseIid
      .delete()
      .catch(e => reportLog(`Could not delete the Firebase ID when resetting app state: ${e.message}`, e));

    // reset storage, but restore previously set env
    const env = await storage.get('environment');
    await storage.removeAll();
    if (env) await storage.save('environment', env, true);

    /**
     *  reset smart wallet service if it's not smart wallet recovery through web portal,
     *  portal recovery initially resets smart wallet instance in order to create it's own
     */
    if (!getState().onboarding.isPortalRecovery) {
      await smartWalletService.reset();
    }

    // reset data stored in keychain
    await resetKeychainDataObject();

    // clear images cache
    ImageCacheManager().clearCache().catch(() => null);

    // reset app webview's cookies
    clearWebViewCookies();
  };
};

export const logoutAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // show logout pending screen
    navigate(NavigationActions.navigate({ routeName: LOGOUT_PENDING }));

    // reset services
    await dispatch(resetAppServicesAction());

    // reset reducer state
    const { isOnline } = getState().session.data; // keep network state after reset
    dispatch(resetAppStateAction({ session: { data: { isOnline } } }));

    // is cleaned up so we would not blind users after they delete wallet :)
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};
