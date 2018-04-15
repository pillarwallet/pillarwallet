// @flow
import ethers from 'ethers';
import {
  GENERATE_ENCRYPTED_WALLET,
  DECRYPT_WALLET,
  UPDATE_WALLET_STATE,
  ENCRYPTING,
  GENERATING,
  DECRYPTING,
  EXISTS,
  EMPTY,
  INVALID_PASSWORD,
  IMPORT_ERROR,
  IMPORT_SET_PIN,
  SET_WALLET_ERROR,
  IMPORTED,
} from 'constants/walletConstants';
import { delay } from 'utils/delay';
import Storage from 'services/storage';
import { validatePin } from 'utils/validators';

const storage = Storage.getInstance('db');

export const generateEncryptedWalletAction = (mnemonic: string, pin: string) => {
  return async (dispatch: Function) => {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: GENERATING,
    });
    await delay(50);

    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);

    const encryptedWallet = await wallet.encrypt(pin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => {});

    await storage.save('wallet', encryptedWallet);
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: wallet,
    });
  };
};

export const decryptWalletAction = (pin: string) => {
  return async (dispatch: Function) => {
    const encryptedWallet = await storage.get('wallet');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(400);
    try {
      const wallet = await ethers.Wallet.fromEncryptedWallet(JSON.stringify(encryptedWallet), pin);
      dispatch({
        type: DECRYPT_WALLET,
        payload: wallet,
      });
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
    }
  };
};

export const checkIfWalletExistsAction = () => {
  return async (dispatch: Function) => {
    try {
      await storage.get('wallet');
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: EXISTS,
      });
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: EMPTY,
      });
    }
  };
};

export const importWalletFromTWordsPhraseAction = (tWordsPhrase: string) => {
  return async (dispatch: Function) => {
    try {
      const importedWallet = ethers.Wallet.fromMnemonic(tWordsPhrase);
      dispatch({
        type: IMPORT_SET_PIN,
        payload: importedWallet,
      });
    } catch (e) {
      dispatch({
        type: SET_WALLET_ERROR,
        payload: {
          code: IMPORT_ERROR,
          message: e.toString(),
        },
      });
    }
  };
};

export const importWalletFromPrivateKeyAction = (privateKey: string) => {
  return async (dispatch: Function) => {
    const walletPrivateKey = privateKey.substr(0, 2) === '0x' ? privateKey : `0x${privateKey}`;
    try {
      const importedWallet = new ethers.Wallet(walletPrivateKey);
      dispatch({
        type: IMPORT_SET_PIN,
        payload: importedWallet,
      });
    } catch (e) {
      dispatch({
        type: SET_WALLET_ERROR,
        payload: {
          code: IMPORT_ERROR,
          message: e.toString(),
        },
      });
    }
  };
};

export const setPinForImportedWalletAction = (pin: string, wallet: Object) => {
  return async (dispatch: Function) => {
    const validationError = validatePin(pin);

    if (validationError) {
      dispatch({
        type: SET_WALLET_ERROR,
        payload: {
          code: IMPORT_ERROR,
          message: validationError,
        },
      });
      return;
    }

    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);

    const encryptedWallet = await wallet.encrypt(pin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => {});

    await storage.save('wallet', encryptedWallet);
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: IMPORTED,
    });
  };
};
