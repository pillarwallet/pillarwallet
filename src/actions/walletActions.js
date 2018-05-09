// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import {
  DECRYPT_WALLET,
  UPDATE_WALLET_MNEMONIC,
  UPDATE_WALLET_STATE,
  DECRYPTING,
  INVALID_PASSWORD,
  IMPORT_ERROR,
  IMPORT_WALLET,
  SET_WALLET_ERROR,
  NEW_WALLET_SET_PIN,
  NEW_WALLET_CONFIRM_PIN,
} from 'constants/walletConstants';
import {
  ASSETS,
  LEGAL_TERMS,
  PIN_CODE_CONFIRMATION,
  SET_WALLET_PIN_CODE,
} from 'constants/navigationConstants';
import { delay } from 'utils/common';
import Storage from 'services/storage';
import shuffle from 'shuffle-array';
import { generateWordsToValidate } from 'utils/wallet';

const storage = Storage.getInstance('db');

export const decryptWalletAction = (pin: string) => {
  return async (dispatch: Function) => {
    const encryptedWallet = await storage.get('wallet');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);
    try {
      const wallet = await ethers.Wallet.fromEncryptedWallet(JSON.stringify(encryptedWallet), pin);
      dispatch({
        type: DECRYPT_WALLET,
        payload: wallet,
      });
      dispatch(NavigationActions.navigate({ routeName: ASSETS }));
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
    }
  };
};

export const importWalletFromTWordsPhraseAction = (tWordsPhrase: string) => {
  return async (dispatch: Function) => {
    try {
      const importedWallet = ethers.Wallet.fromMnemonic(tWordsPhrase);
      dispatch({
        type: IMPORT_WALLET,
        payload: importedWallet,
      });
      dispatch(NavigationActions.navigate({ routeName: SET_WALLET_PIN_CODE }));
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
        type: IMPORT_WALLET,
        payload: importedWallet,
      });
      dispatch(NavigationActions.navigate({ routeName: SET_WALLET_PIN_CODE }));
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

const NUM_WORDS_TO_CHECK = 3;
export const generateWalletMnemonicAction = () => {
  return async (dispatch: Function) => {
    const mnemonicPhrase = ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
    const mnemonicList = mnemonicPhrase.split(' ');
    const shuffledMnemonicPhrase = shuffle(mnemonicList, { copy: true }).join(' ');
    const wordsToValidate = generateWordsToValidate(NUM_WORDS_TO_CHECK, mnemonicList.length);

    dispatch({
      type: UPDATE_WALLET_MNEMONIC,
      payload: {
        original: mnemonicPhrase,
        shuffled: shuffledMnemonicPhrase,
        wordsToValidate,
      },
    });
  };
};

export const setPinForNewWalletAction = (pin: string) => {
  return async (dispatch: Function) => {
    dispatch({
      type: NEW_WALLET_SET_PIN,
      payload: pin,
    });
    dispatch(NavigationActions.navigate({ routeName: PIN_CODE_CONFIRMATION }));
  };
};

export const confirmPinForNewWalletAction = (pin: string) => {
  return async (dispatch: Function) => {
    dispatch({
      type: NEW_WALLET_CONFIRM_PIN,
      payload: pin,
    });
    dispatch(NavigationActions.navigate({ routeName: LEGAL_TERMS }));
  };
};
