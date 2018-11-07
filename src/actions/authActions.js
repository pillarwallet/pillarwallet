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
  EXISTING_PASSWORD,
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
  DECRYPTED,
} from 'constants/walletConstants';
import { APP_FLOW, AUTH_FLOW, ONBOARDING_FLOW, ASSETS } from 'constants/navigationConstants';
import { UPDATE_USER, PENDING, REGISTERED } from 'constants/userConstants';
import { LOG_OUT } from 'constants/authConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { delay } from 'utils/common';
import { generateChatPassword } from 'utils/chat';
import Storage from 'services/storage';
import { navigate, getNavigationState } from 'services/navigation';
import ChatService from 'services/chat';
import firebase from 'react-native-firebase';
import { setupSentryAction } from 'actions/appActions';
import { saveDbAction } from './dbActions';

const Crashlytics = firebase.crashlytics();

const storage = Storage.getInstance('db');
const chat = new ChatService();

export const loginAction = (pin: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const { lastActiveScreen, lastActiveScreenParams } = getNavigationState();
    const { wallet: encryptedWallet } = await storage.get('wallet');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);
    const saltedPin = getSaltedPin(pin);
    try {
      const wallet = await ethers.Wallet.RNfromEncryptedWallet(JSON.stringify(encryptedWallet), saltedPin);
      api.init(wallet.privateKey);

      let { user = {} } = await storage.get('user');
      const userState = user.walletId ? REGISTERED : PENDING;
      if (userState === REGISTERED) {
        const userInfo = await api.userInfo(user.walletId);
        user = merge({}, user, userInfo);
        dispatch(saveDbAction('user', { user }, true));
      }
      Crashlytics.setUserIdentifier(user.username);
      dispatch({
        type: UPDATE_USER,
        payload: { user, state: userState },
      });

      const fcmToken = await firebase.messaging().getToken();
      chat.init({
        userId: user.id,
        username: user.username,
        password: generateChatPassword(wallet.privateKey),
        walletId: user.walletId,
        ethAddress: wallet.address,
      })
        .then(() => chat.client.registerAccount())
        .then(() => chat.client.setFcmId(fcmToken))
        .catch(() => null);

      dispatch({
        type: DECRYPT_WALLET,
        payload: {
          address: wallet.address,
        },
      });
      if (!__DEV__) {
        dispatch(setupSentryAction(user, wallet));
      }
      const navigateToAppAction = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({
          routeName: lastActiveScreen || ASSETS, // current active screen will be always AUTH_FLOW due to login/logout
          params: lastActiveScreenParams,
        }),
      });
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
  mnemonic: boolean
}

const defaultDecryptionSettings = {
  mnemonic: false,
};

export const checkPinAction = (
  pin: string,
  onValidPin?: Function,
  options: DecryptionSettings = defaultDecryptionSettings,
  checkExisting: boolean,
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
      if (checkExisting) {
        dispatch({
          type: UPDATE_WALLET_STATE,
          payload: EXISTING_PASSWORD,
        });
      } else {
        dispatch({
          type: DECRYPT_WALLET,
          payload: {
            address: wallet.address,
          },
        });
        if (onValidPin) {
          onValidPin();
        }
      }
    } catch (e) {
      if (checkExisting) {
        if (onValidPin) {
          onValidPin(pin);
        }
      } else {
        dispatch({
          type: UPDATE_WALLET_STATE,
          payload: INVALID_PASSWORD,
        });
      }
    }
  };
};

export const changePinAction = (pin: string) => {
  return async (dispatch: Function, getState: () => Object) => {
    const { wallet: { data: wallet } } = getState();

    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);

    const saltedPin = getSaltedPin(pin);
    const encryptedWallet = await wallet.RNencrypt(saltedPin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    dispatch(saveDbAction('wallet', { wallet: encryptedWallet }));

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
    await storage.removeAll();
  };
};
