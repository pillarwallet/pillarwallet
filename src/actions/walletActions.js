// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import {
  UPDATE_WALLET_MNEMONIC,
  IMPORT_ERROR,
  IMPORT_WALLET,
  SET_WALLET_ERROR,
  RESET_WALLET_ERROR,
  NEW_WALLET_SET_PIN,
  NEW_WALLET_CONFIRM_PIN,
  IMPORT_WALLET_PRIVATE_KEY,
  IMPORT_WALLET_TWORDS_PHRASE,
  SET_API_USER,
} from 'constants/walletConstants';
import {
  NEW_PROFILE,
  PIN_CODE_CONFIRMATION,
  SET_WALLET_PIN_CODE,
} from 'constants/navigationConstants';
import shuffle from 'shuffle-array';
import { generateWordsToValidate } from 'utils/wallet';

export const importWalletFromTWordsPhraseAction = (tWordsPhrase: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    try {
      const importedWallet = ethers.Wallet.fromMnemonic(tWordsPhrase);

      api.init(importedWallet.privateKey);
      const apiUser = await api.validateAddress(importedWallet.address);

      const payload = {
        importedWallet,
        apiUser,
      };
      dispatch({
        type: IMPORT_WALLET,
        payload,
      });
      dispatch(NavigationActions.navigate({ routeName: SET_WALLET_PIN_CODE }));
    } catch (e) {
      dispatch({
        type: SET_WALLET_ERROR,
        payload: {
          code: IMPORT_ERROR,
          message: e.toString(),
          field: IMPORT_WALLET_TWORDS_PHRASE,
        },
      });
    }
  };
};

export const importWalletFromPrivateKeyAction = (privateKey: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const walletPrivateKey = privateKey.substr(0, 2) === '0x' ? privateKey : `0x${privateKey}`;
    try {
      const importedWallet = new ethers.Wallet(walletPrivateKey);

      api.init(importedWallet.privateKey);
      const apiUser = await api.validateAddress(importedWallet.address);

      const payload = {
        importedWallet,
        apiUser,
      };
      dispatch({
        type: IMPORT_WALLET,
        payload,
      });
      dispatch(NavigationActions.navigate({ routeName: SET_WALLET_PIN_CODE }));
    } catch (e) {
      dispatch({
        type: SET_WALLET_ERROR,
        payload: {
          code: IMPORT_ERROR,
          message: e.reason.toString(),
          field: IMPORT_WALLET_PRIVATE_KEY,
        },
      });
    }
  };
};

export const resetWalletErrorAction = () => ({
  type: RESET_WALLET_ERROR,
  payload: { },
});

const NUM_WORDS_TO_CHECK = 3;

/**
 * Generates a mnemonic phrase, and accepts mnemonic as a parameter.
 * If parameter is passed just reshuffle the phrase
 * and don't generate a new one.
 * @param {String} mnemonicPhrase
 */
export const generateWalletMnemonicAction = (mnemonicPhrase?: string) => {
  return async (dispatch: Function) => {
    mnemonicPhrase = mnemonicPhrase || ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
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
    dispatch({
      type: SET_API_USER,
      payload: {},
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
    dispatch(NavigationActions.navigate({ routeName: NEW_PROFILE }));
  };
};
