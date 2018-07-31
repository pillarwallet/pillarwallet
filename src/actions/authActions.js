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
import { ASSETS, APP_FLOW } from 'constants/navigationConstants';
import { delay } from 'utils/common';
import { generateChatPassword } from 'utils/chat';
import Storage from 'services/storage';
import ChatService from 'services/chat';

const storage = Storage.getInstance('db');
const chat = new ChatService();

export const checkPinAction = (pin: string, onValidPin?: Function) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const { wallet: encryptedWallet } = await storage.get('wallet');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);
    const saltedPin = getSaltedPin(pin);
    try {
      const wallet = await ethers.Wallet.fromEncryptedWallet(JSON.stringify(encryptedWallet), saltedPin);
      api.init(wallet.privateKey);
      const { user } = await storage.get('user');
      await chat.init({
        username: user.username,
        password: generateChatPassword(wallet.privateKey),
      }).catch(() => null);
      await chat.client.registerAccount().catch(() => null);
      dispatch({
        type: DECRYPT_WALLET,
        payload: wallet,
      });

      if (onValidPin) {
        onValidPin();
        return;
      }

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

export const changePinAction = (pin: string) => {
  return async (dispatch: Function, getState: () => Object) => {
    const { wallet: { data: wallet } } = getState();

    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);

    const saltedPin = getSaltedPin(pin);
    const encryptedWallet = await wallet.encrypt(saltedPin, { scrypt: { N: 1024 } })
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
