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

// constants
import {
  DECRYPT_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPTING,
  INVALID_PASSWORD,
  ENCRYPTING,
  DECRYPTED,
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
import { SET_USERNAME, UPDATE_USER, PENDING, REGISTERED } from 'constants/userConstants';
import { LOG_OUT } from 'constants/authConstants';
import { DARK_THEME, RESET_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { SET_RECOVERY_PORTAL_TEMPORARY_WALLET } from 'constants/recoveryPortalConstants';
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
import { setAppThemeAction } from './appSettingsActions';
import { setActiveBlockchainNetworkAction } from './blockchainNetworkActions';
import { loadFeatureFlagsAction } from './featureFlagsActions';
import { getExchangeSupportedAssetsAction } from './exchangeActions';
import { fetchReferralRewardAction } from './referralsActions';
import { executeDeepLinkAction } from './deepLinkActions';
import {
  checkIfRecoveredSmartWalletFinishedAction,
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

    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });

    try {
      let wallet;

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
      const userState = user.walletId ? REGISTERED : PENDING;

      const decryptedPrivateKey = wallet?.privateKey;
      if (!decryptedPrivateKey) {
        reportLog('Unable to get wallet private key', { user });
        throw new Error();
      }


      if (user.username) {
        dispatch({ type: SET_USERNAME, payload: user.username });
      }

      if (userState === REGISTERED) {
        // oauth fallback method for expired access token
        const updateOAuth = updateOAuthTokensCB(dispatch);

        // oauth fallback method for all tokens expired or invalid
        const onOAuthTokensFailed = onOAuthTokensFailedCB(dispatch);

        // init API
        api.init(updateOAuth, oAuthTokens, onOAuthTokensFailed);

        // execute login success callback
        if (onLoginSuccess) {
          const rawPrivateKey = decryptedPrivateKey.indexOf('0x') === 0
            ? decryptedPrivateKey.slice(2)
            : decryptedPrivateKey;
          await onLoginSuccess(rawPrivateKey);
        }

        // set API username (local method)
        api.setUsername(user.username);

        if (isOnline) {
          // make first api call which can also trigger OAuth fallback methods
          const userInfo = await api.userInfo(user.walletId);

          // Dispatch ation to try and get the latest remote config values...
          dispatch(loadFeatureFlagsAction());

          // update FCM
          dispatch(updateFcmTokenAction(user.walletId));

          // save updated user, just in case userInfo endpoint failed check if result is empty
          if (!isEmpty(userInfo)) {
            user = merge({}, user, userInfo);
            dispatch(saveDbAction('user', { user }, true));
          }

          // to get exchange supported assets in order to show only supported assets on exchange selectors
          // and show exchange button on supported asset screen only
          dispatch(getExchangeSupportedAssetsAction());
        }

        // init smart wallet
        await dispatch(initOnLoginSmartWalletAccountAction(decryptedPrivateKey));

        // key based wallet migration – switch to smart wallet if key based was active
        if (getActiveAccountType(accounts) !== ACCOUNT_TYPES.SMART_WALLET) {
          const smartWalletAccount = findFirstSmartAccount(accounts);
          if (smartWalletAccount) {
            await dispatch(setActiveAccountAction(smartWalletAccount.id));
          } else {
            // very old user that doesn't have any smart wallet, let's create one and migrate safe
            await dispatch(importSmartWalletAccountsAction(decryptedPrivateKey));
          }
        }

        /**
         * set Ethereum network as active if we disable feature flag
         * or end beta testing program while user has set BTC as active network
         */
        const revertToDefaultNetwork = !isSupportedBlockchain(blockchainNetwork);
        if (revertToDefaultNetwork || !blockchainNetwork) {
          dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
        }
      } else {
        api.init();
      }

      dispatch(updatePinAttemptsAction(false));

      firebaseCrashlytics.setUserId(user.username);
      dispatch({
        type: UPDATE_USER,
        payload: { user, state: userState },
      });

      const { address } = wallet;
      dispatch({
        type: DECRYPT_WALLET,
        payload: {
          address,
          privateKey: userState === PENDING ? decryptedPrivateKey : undefined,
        },
      });

      if (!__DEV__) {
        dispatch(setupSentryAction(user, wallet));
      }

      const isWalletRecoveryPending = get(getState(), 'wallet.backupStatus.isRecoveryPending');
      if (isWalletRecoveryPending) {
        dispatch({ type: SET_RECOVERY_PORTAL_TEMPORARY_WALLET, payload: wallet });
        api.init();
        navigate(NavigationActions.navigate({ routeName: RECOVERY_PORTAL_WALLET_RECOVERY_PENDING }));
        await smartWalletService.init(
          decryptedPrivateKey,
          (event) => dispatch(checkRecoveredSmartWalletStateAction(event)),
        );
        dispatch(checkIfRecoveredSmartWalletFinishedAction(wallet));
        return;
      }

      dispatch(fetchSmartWalletTransactionsAction());
      dispatch(fetchReferralRewardAction());
      dispatch(checkIfKeyBasedWalletHasPositiveBalanceAction());

      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams) return;

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

      dispatch(checkForWalletBackupToastAction());
      dispatch(getWalletsCreationEventsAction());
      dispatch(checkKeyBasedAssetTransferTransactionsAction());

      if (!initialDeeplinkExecuted) {
        Linking.getInitialURL()
          .then(url => {
            if (url) dispatch(executeDeepLinkAction(url, true));
          })
          .catch(e => reportLog(`Could not get initial deeplink URL: ${e.message}`, e));
      }
      navigate(navigateToAppAction);
    } catch (e) {
      reportLog(`An error occured whilst trying to complete auth actions: ${e.errorMessage}`, e);

      dispatch(updatePinAttemptsAction(true));
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
    }
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
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
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
          type: DECRYPT_WALLET,
          payload: {
            address: wallet.address,
          },
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
      type: UPDATE_WALLET_STATE,
      payload: INVALID_PASSWORD,
    });
  };
};

export const changePinAction = (newPin: string, currentPin: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { wallet: encryptedWallet } = await storage.get('wallet');
    const { appSettings: { data: { useBiometrics } } } = getState();
    const backupStatus = get(encryptedWallet, 'backupStatus', {});

    dispatch({ type: UPDATE_WALLET_STATE, payload: ENCRYPTING });
    await delay(50);
    const currentSaltedPin = await getSaltedPin(currentPin, dispatch);
    const wallet = await decryptWallet(encryptedWallet, currentSaltedPin);

    await dispatch(encryptAndSaveWalletAction(newPin, wallet, backupStatus, useBiometrics));
  };
};

export const resetIncorrectPasswordAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTED,
    });
  };
};

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

export const resetAppState = async () => {
  Intercom.logout();
  await firebaseIid.delete()
    .catch(e => reportLog(`Could not delete the Firebase ID when resetting app state: ${e.message}`, e));
  await storage.removeAll();
  await smartWalletService.reset();
  clearWebViewCookies();
};

export const logoutAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    navigate(NavigationActions.navigate({ routeName: LOGOUT_PENDING }));
    const themeType = get(getState(), 'appSettings.data.themeType', '');
    await resetAppState();
    await dispatch({ type: LOG_OUT });
    await dispatch({ type: RESET_APP_SETTINGS, payload: {} });
    await resetKeychainDataObject();
    if (themeType === DARK_THEME) await dispatch(setAppThemeAction(DARK_THEME)); // to persist dark theme after storage
    // is cleaned up so we would not blind users after they delete wallet :)
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};
