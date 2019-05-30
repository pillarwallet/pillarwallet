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
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import merge from 'lodash.merge';
import {
  DECRYPT_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPTING,
  INVALID_PASSWORD,
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
  DECRYPTED,
} from 'constants/walletConstants';
import {
  APP_FLOW,
  AUTH_FLOW,
  ONBOARDING_FLOW,
  ASSETS,
  CHAT,
  CHAT_LIST,
  PIN_CODE_UNLOCK,
} from 'constants/navigationConstants';
import { UPDATE_USER, PENDING, REGISTERED } from 'constants/userConstants';
import { LOG_OUT } from 'constants/authConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { delay } from 'utils/common';
import Storage from 'services/storage';
import { navigate, getNavigationState, getNavigationPathAndParamsState } from 'services/navigation';
import ChatService from 'services/chat';
import firebase from 'react-native-firebase';
import Intercom from 'react-native-intercom';
import { toastWalletBackup } from 'utils/toasts';
import { updateOAuthTokensCB, onOAuthTokensFailedCB } from 'utils/oAuth';
import { getSaltedPin, normalizeWalletAddress } from 'utils/wallet';
import { setupSentryAction } from 'actions/appActions';
import { signalInitAction } from 'actions/signalClientActions';
import { updateConnectionKeyPairs } from 'actions/connectionKeyPairActions';
import { initSmartWalletAccountAction } from 'actions/accountsActions';
import { saveDbAction } from './dbActions';

const Crashlytics = firebase.crashlytics();

const storage = Storage.getInstance('db');
const chat = new ChatService();

export const loginAction = (pin: string, touchID?: boolean = false, onLoginSuccess?: Function) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const {
      connectionKeyPairs: { data: connectionKeyPairs, lastConnectionKeyIndex },
    } = getState();
    const { lastActiveScreen, lastActiveScreenParams } = getNavigationState();
    const { wallet: encryptedWallet } = await storage.get('wallet');
    const { oAuthTokens } = await storage.get('oAuthTokens');

    const generateNewConnKeys = !(connectionKeyPairs.length > 20 && lastConnectionKeyIndex > -1);

    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);
    const saltedPin = await getSaltedPin(pin, dispatch);
    try {
      let wallet;
      if (!touchID) {
        const decryptionOptions = generateNewConnKeys ? { mnemonic: true } : {};
        wallet = await ethers.Wallet.RNfromEncryptedWallet(
          JSON.stringify(encryptedWallet),
          saltedPin,
          decryptionOptions,
        );
      } else {
        const walletAddress = normalizeWalletAddress(encryptedWallet.address);
        wallet = { ...encryptedWallet, address: walletAddress };
      }

      let { user = {} } = await storage.get('user');
      const userState = user.walletId ? REGISTERED : PENDING;
      if (userState === REGISTERED) {
        const fcmToken = await firebase.messaging().getToken().catch(() => null);
        dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });

        await Intercom.sendTokenToIntercom(fcmToken).catch(() => null);
        const signalCredentials = {
          userId: user.id,
          username: user.username,
          walletId: user.walletId,
          ethAddress: wallet.address,
          fcmToken,
        };
        const updateOAuth = updateOAuthTokensCB(dispatch, signalCredentials);
        const onOAuthTokensFailed = onOAuthTokensFailedCB(dispatch);
        api.init(updateOAuth, oAuthTokens, onOAuthTokensFailed);
        if (onLoginSuccess && wallet.privateKey) {
          let { privateKey: privateKeyParam } = wallet;
          privateKeyParam = privateKeyParam.indexOf('0x') === 0 ? privateKeyParam.slice(2) : privateKeyParam;
          await onLoginSuccess(privateKeyParam);
        }
        api.setUsername(user.username);
        const userInfo = await api.userInfo(user.walletId);
        await api.updateFCMToken(user.walletId, fcmToken);
        const { oAuthTokens: { data: OAuthTokensObject } } = getState();
        await dispatch(signalInitAction({ ...signalCredentials, ...OAuthTokensObject }));
        user = merge({}, user, userInfo);
        dispatch(saveDbAction('user', { user }, true));
        await
        dispatch(updateConnectionKeyPairs(wallet.mnemonic, wallet.privateKey, user.walletId, generateNewConnKeys));

        const { featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } } } = getState();
        if (smartWalletFeatureEnabled) {
          dispatch(initSmartWalletAccountAction(wallet.privateKey));
        }
      } else {
        api.init();
      }
      Crashlytics.setUserIdentifier(user.username);
      dispatch({
        type: UPDATE_USER,
        payload: { user, state: userState },
      });

      await storage.viewCleanup().catch(() => null);

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

      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams) return;
      const currentFlow = pathAndParams.path.split('/')[0];

      const navigateToLastActiveScreen = NavigationActions.navigate({
        // current active screen will be always AUTH_FLOW due to login/logout
        routeName: lastActiveScreen || ASSETS,
        params: lastActiveScreenParams,
      });

      const isOpeningAChatNotification = lastActiveScreen === CHAT && currentFlow === AUTH_FLOW;
      const navigateToRoute = isOpeningAChatNotification ?
        NavigationActions.navigate({
          routeName: CHAT_LIST,
          params: {},
          action: navigateToLastActiveScreen,
        }) : navigateToLastActiveScreen;
      const navigateToAppAction = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: navigateToRoute,
      });

      const {
        isImported,
        isBackedUp,
      } = getState().wallet.backupStatus;

      const isWalletBackedUp = isImported || isBackedUp;
      toastWalletBackup(isWalletBackedUp);

      navigate(navigateToAppAction);
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
    }
  };
};

type DecryptionSettings = {
  mnemonic: boolean,
};

const defaultDecryptionSettings = {
  mnemonic: false,
};

export const checkPinAction = (
  pin: string,
  onValidPin?: Function,
  options: DecryptionSettings = defaultDecryptionSettings,
) => {
  return async (dispatch: Function) => {
    const { wallet: encryptedWallet } = await storage.get('wallet');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);
    const saltedPin = await getSaltedPin(pin, dispatch);
    try {
      const wallet = await ethers.Wallet.RNfromEncryptedWallet(JSON.stringify(encryptedWallet), saltedPin, options);
      dispatch({
        type: DECRYPT_WALLET,
        payload: {
          address: wallet.address,
        },
      });
      if (onValidPin) {
        onValidPin(pin, wallet);
      }
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
    }
  };
};

export const changePinAction = (newPin: string, currentPin: string) => {
  return async (dispatch: Function) => {
    const { wallet: encryptedWallet } = await storage.get('wallet');

    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);
    const currentSaltedPin = await getSaltedPin(currentPin, dispatch);
    const wallet = await ethers.Wallet.RNfromEncryptedWallet(
      JSON.stringify(encryptedWallet),
      currentSaltedPin,
      {
        mnemonic: true,
      });

    const newSaltedPin = await getSaltedPin(newPin, dispatch);
    const newEncryptedWallet = await wallet.RNencrypt(newSaltedPin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    dispatch(saveDbAction('wallet', { wallet: newEncryptedWallet }));

    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: {
        address: wallet.address,
      },
    });
  };
};

export const resetIncorrectPasswordAction = () => {
  return async (dispatch: Function) => {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTED,
    });
  };
};

export const lockScreenAction = (onLoginSuccess?: Function, errorMessage?: string) => {
  return async () => {
    navigate(NavigationActions.navigate({
      routeName: AUTH_FLOW,
      params: {},
      action: NavigationActions.navigate({
        routeName: PIN_CODE_UNLOCK,
        params: {
          onLoginSuccess,
          errorMessage,
        },
      }),
    }));
  };
};

export const logoutAction = () => {
  return async (dispatch: Function) => {
    Intercom.logout();
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
    dispatch({ type: LOG_OUT });
    dispatch({ type: UPDATE_APP_SETTINGS, payload: {} });
    chat.client.resetAccount().catch(() => null);
    await firebase.iid().delete().catch(() => {});
    await storage.removeAll();
  };
};
