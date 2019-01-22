// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import { getSaltedPin } from 'utils/wallet';
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
import { APP_FLOW, AUTH_FLOW, ONBOARDING_FLOW, ASSETS, CHAT, CHAT_LIST } from 'constants/navigationConstants';
import { UPDATE_USER, PENDING, REGISTERED } from 'constants/userConstants';
import { LOG_OUT } from 'constants/authConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { delay } from 'utils/common';
import Storage from 'services/storage';
import { navigate, getNavigationState, getNavigationPathAndParamsState } from 'services/navigation';
import ChatService from 'services/chat';
import firebase from 'react-native-firebase';
import { toastWalletBackup } from 'utils/toasts';
import { updateOAuthTokensCB } from 'utils/oAuth';
import { setupSentryAction } from 'actions/appActions';
import { signalInitAction } from 'actions/signalClientActions';
import { saveDbAction } from './dbActions';

const Crashlytics = firebase.crashlytics();

const storage = Storage.getInstance('db');
const chat = new ChatService();

export const loginAction = (pin: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const { lastActiveScreen, lastActiveScreenParams } = getNavigationState();
    const { wallet: encryptedWallet } = await storage.get('wallet');
    const { oAuthTokens } = await storage.get('oAuthTokens');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);
    const saltedPin = getSaltedPin(pin);
    try {
      const wallet = await ethers.Wallet.RNfromEncryptedWallet(JSON.stringify(encryptedWallet), saltedPin);
      let { user = {} } = await storage.get('user');
      const userState = user.walletId ? REGISTERED : PENDING;
      if (userState === REGISTERED) {
        const fcmToken = await firebase.messaging().getToken().catch(() => null);
        const signalCredentials = {
          userId: user.id,
          username: user.username,
          walletId: user.walletId,
          ethAddress: wallet.address,
          fcmToken,
        };
        const { oAuthTokens: { data: OAuthTokensObject } } = getState();
        dispatch(signalInitAction({ ...signalCredentials, ...OAuthTokensObject }));
        const updateOAuth = updateOAuthTokensCB(dispatch, signalCredentials);
        api.init(wallet.privateKey, updateOAuth, oAuthTokens);
        api.setUsername(user.username);
        const userInfo = await api.userInfo(user.walletId);
        user = merge({}, user, userInfo);
        dispatch(saveDbAction('user', { user }, true));
      } else {
        api.init(wallet.privateKey);
      }
      Crashlytics.setUserIdentifier(user.username);
      dispatch({
        type: UPDATE_USER,
        payload: { user, state: userState },
      });

      await storage.viewCleanup().catch(() => null);

      dispatch({
        type: DECRYPT_WALLET,
        payload: {
          address: wallet.address,
        },
      });
      if (!__DEV__) {
        dispatch(setupSentryAction(user, wallet));
      }

      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams) return;
      const currentFlow = pathAndParams.path.split('/')[0];

      const navigateToLastActiveScreen = NavigationActions.navigate({
        routeName: lastActiveScreen || ASSETS, // current active screen will be always AUTH_FLOW due to login/logout
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
    const saltedPin = getSaltedPin(pin);
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
    const currentSaltedPin = getSaltedPin(currentPin);
    const wallet = await ethers.Wallet.RNfromEncryptedWallet(
      JSON.stringify(encryptedWallet),
      currentSaltedPin,
      {
        mnemonic: true,
      });

    const newSaltedPin = getSaltedPin(newPin);
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

export const lockScreenAction = () => {
  return async () => {
    navigate(NavigationActions.navigate({ routeName: AUTH_FLOW }));
  };
};

export const logoutAction = () => {
  return async (dispatch: Function) => {
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
    dispatch({ type: LOG_OUT });
    dispatch({ type: UPDATE_APP_SETTINGS, payload: {} });
    chat.client.resetAccount().catch(() => null);
    await firebase.iid().delete().catch(() => {});
    await storage.removeAll();
  };
};
