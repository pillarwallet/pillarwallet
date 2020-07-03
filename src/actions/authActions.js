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

// utils
import { delay, reportOrWarn } from 'utils/common';
import { getSaltedPin, decryptWallet, constructWalletFromPrivateKey } from 'utils/wallet';
import { updateOAuthTokensCB, onOAuthTokensFailedCB } from 'utils/oAuth';
import { userHasSmartWallet } from 'utils/smartWallet';
import { clearWebViewCookies } from 'utils/exchange';
import {
  setKeychainDataObject, resetKeychainDataObject, getWalletFromPkByPin, canLoginWithPkFromPin,
} from 'utils/keychain';

// services
import Storage from 'services/storage';
import ChatService from 'services/chat';
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
import { signalInitAction } from './signalClientActions';
import { initOnLoginSmartWalletAccountAction } from './accountsActions';
import {
  encryptAndSaveWalletAction,
  checkForWalletBackupToastAction,
  updatePinAttemptsAction,
} from './walletActions';
import { fetchTransactionsHistoryAction } from './historyActions';
import { setAppThemeAction } from './appSettingsActions';
import { setActiveBlockchainNetworkAction } from './blockchainNetworkActions';
import { loadFeatureFlagsAction } from './featureFlagsActions';
import { getExchangeSupportedAssetsAction } from './exchangeActions';
import { labelUserAsLegacyAction } from './userActions';
import { updateConnectionsAction } from './connectionsActions';
import { fetchReferralRewardAction } from './referralsActions';
import { executeDeepLinkAction } from './deepLinkActions';
import {
  checkIfRecoveredSmartWalletFinishedAction,
  checkRecoveredSmartWalletStateAction,
} from './recoveryPortalActions';


const storage = Storage.getInstance('db');
const chat = new ChatService();

export const updateFcmTokenAction = (walletId: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const fcmToken = await firebaseMessaging.getToken().catch(() => null);
    if (!fcmToken) return;
    dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });
    Intercom.sendTokenToIntercom(fcmToken).catch(() => null);
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
        await setKeychainDataObject(
          {
            pin,
            privateKey: wallet.privateKey,
            mnemonic: wallet?.mnemonic?.phrase || '',
          },
          useBiometrics);
      } else if (privateKey) {
        wallet = constructWalletFromPrivateKey(privateKey);
      } else {
        // nothing provided, invalid login
        throw new Error();
      }

      let { user = {} } = await storage.get('user');
      const userState = user.walletId ? REGISTERED : PENDING;

      if (user.username) {
        dispatch({ type: SET_USERNAME, payload: user.username });
      }

      if (userState === REGISTERED) {
        // signal credentials
        const signalCredentials = {
          userId: user.id,
          username: user.username,
          walletId: user.walletId,
          ethAddress: wallet.address,
        };

        // oauth fallback method for expired access token
        const updateOAuth = updateOAuthTokensCB(dispatch, signalCredentials);

        // oauth fallback method for all tokens expired or invalid
        const onOAuthTokensFailed = onOAuthTokensFailedCB(dispatch);

        // init API
        api.init(updateOAuth, oAuthTokens, onOAuthTokensFailed);

        // execute login success callback
        if (onLoginSuccess && wallet.privateKey) {
          let { privateKey: privateKeyParam } = wallet;
          privateKeyParam = privateKeyParam.indexOf('0x') === 0 ? privateKeyParam.slice(2) : privateKeyParam;
          await onLoginSuccess(privateKeyParam);
        }

        // set API username (local method)
        api.setUsername(user.username);

        if (isOnline) {
          // make first api call which can also trigger OAuth fallback methods
          const userInfo = await api.userInfo(user.walletId);

          await dispatch(loadFeatureFlagsAction(userInfo));

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

        // perform signal init
        dispatch(signalInitAction({ ...signalCredentials, ...oAuthTokens }));

        const bitcoinFeatureEnabled = get(getState(), 'featureFlags.data.BITCOIN_ENABLED');

        // init smart wallet
        if (wallet.privateKey && userHasSmartWallet(accounts)) {
          await dispatch(initOnLoginSmartWalletAccountAction(wallet.privateKey));
        }

        /**
         * set Ethereum network as active if we disable feature flag
         * or end beta testing program while user has set BTC as active network
         */
        const revertToDefaultNetwork = !bitcoinFeatureEnabled && blockchainNetwork === BLOCKCHAIN_NETWORK_TYPES.BITCOIN;
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

      if (userState === REGISTERED) {
        dispatch(labelUserAsLegacyAction());
      }

      const { address } = wallet;
      dispatch({
        type: DECRYPT_WALLET,
        payload: {
          address,
          privateKey: (userState === PENDING) ? wallet.privateKey : undefined,
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
          wallet.privateKey,
          (event) => dispatch(checkRecoveredSmartWalletStateAction(event)),
        );
        dispatch(checkIfRecoveredSmartWalletFinishedAction(wallet));
        return;
      }

      dispatch(fetchTransactionsHistoryAction());
      if (user.walletId) dispatch(updateConnectionsAction());
      dispatch(fetchReferralRewardAction());

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

      if (!initialDeeplinkExecuted) {
        Linking.getInitialURL()
          .then(url => {
            if (url) dispatch(executeDeepLinkAction(url, true));
          })
          .catch(() => {});
      }
      navigate(navigateToAppAction);
    } catch (e) {
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
  await firebaseIid.delete().catch(() => {});
  await chat.client.resetAccount().catch(() => null);
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
