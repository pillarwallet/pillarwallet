// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import { getSaltedPin } from 'utils/wallet';
import {
  DECRYPT_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPTING,
  INVALID_PASSWORD,
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
  DECRYPTED,
} from 'constants/walletConstants';
import { ASSETS, APP_FLOW, AUTH_FLOW } from 'constants/navigationConstants';
import { UPDATE_USER, PENDING, REGISTERED } from 'constants/userConstants';
import { delay } from 'utils/common';
import { generateChatPassword } from 'utils/chat';
import Storage from 'services/storage';
import ChatService from 'services/chat';
import firebase from 'react-native-firebase';

const Crashlytics = firebase.crashlytics();

const storage = Storage.getInstance('db');
const chat = new ChatService();

export const loginAction = (pin: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
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

      const { user = {} } = await storage.get('user');
      Crashlytics.setUserIdentifier(user.username);
      const userState = user.walletId ? REGISTERED : PENDING;
      dispatch({
        type: UPDATE_USER,
        payload: { user, state: userState },
      });

      const fcmToken = await firebase.messaging().getToken();
      chat.init({
        username: user.username,
        password: generateChatPassword(wallet.privateKey),
      })
        .then(() => chat.client.registerAccount())
        .then(() => chat.client.setFcmId(fcmToken))
        .catch(() => null);

      dispatch({
        type: DECRYPT_WALLET,
        payload: wallet,
      });

      const navigateToAssetsAction = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({ routeName: ASSETS }),
      });

      dispatch(navigateToAssetsAction);
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
        payload: wallet,
      });
      if (onValidPin) {
        onValidPin();
      }
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
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

    await storage.save('wallet', { wallet: encryptedWallet });

    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: wallet,
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
  return async (dispatch: Function) => {
    dispatch(NavigationActions.navigate({ routeName: AUTH_FLOW }));
  };
};
