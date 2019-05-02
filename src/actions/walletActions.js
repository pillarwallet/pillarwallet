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
  RESET_WALLET_IMPORT,
  BACKUP_WALLET,
  REMOVE_PRIVATE_KEY,
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
} from 'constants/walletConstants';
import {
  LEGAL_TERMS,
  PIN_CODE_CONFIRMATION,
  NEW_PROFILE,
} from 'constants/navigationConstants';
import shuffle from 'shuffle-array';
import { generateMnemonicPhrase, generateWordsToValidate } from 'utils/wallet';
import { navigate } from 'services/navigation';
import SmartWalletService from 'services/smartWallet';
import {
  addNewAccountAction,
  setActiveAccountAction,
} from 'actions/accountsActions';
import type { SmartWalletAccount } from 'models/SmartWalletAccount';
import { saveDbAction } from './dbActions';
import { selfAwardBadgeAction } from './badgesActions';

let smartWalletService: SmartWalletService;

export const importWalletFromTWordsPhraseAction = (tWordsPhrase: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    try {
      const importedWallet = ethers.Wallet.fromMnemonic(tWordsPhrase);

      api.init();
      let apiUser = {};
      const addressValidationResponse = await api.validateAddress(importedWallet.address);
      if (addressValidationResponse.walletId) {
        apiUser = {
          id: addressValidationResponse.id,
          walletId: addressValidationResponse.walletId,
          username: addressValidationResponse.username,
          profileLargeImage: addressValidationResponse.profileImage,
        };
      }

      const payload = {
        importedWallet,
        apiUser,
      };
      dispatch({
        type: IMPORT_WALLET,
        payload,
      });
      navigate(NavigationActions.navigate({ routeName: NEW_PROFILE }));
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

      api.init();
      let apiUser = {};
      const addressValidationResponse = await api.validateAddress(importedWallet.address);
      if (addressValidationResponse.walletId) {
        apiUser = {
          id: addressValidationResponse.id,
          walletId: addressValidationResponse.walletId,
          username: addressValidationResponse.username,
          profileLargeImage: addressValidationResponse.profileImage,
        };
      }

      const payload = {
        importedWallet,
        apiUser,
      };
      dispatch({
        type: IMPORT_WALLET,
        payload,
      });
      navigate(NavigationActions.navigate({ routeName: NEW_PROFILE }));
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

export const navigateToNewWalletPageAction = () => {
  return async (dispatch: Function) => {
    dispatch({
      type: RESET_WALLET_IMPORT,
    });
    navigate(NavigationActions.navigate({ routeName: NEW_PROFILE }));
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
    mnemonicPhrase = generateMnemonicPhrase(mnemonicPhrase);
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
    navigate(NavigationActions.navigate({ routeName: PIN_CODE_CONFIRMATION }));
  };
};

export const confirmPinForNewWalletAction = (pin: string) => {
  return async (dispatch: Function) => {
    dispatch({
      type: NEW_WALLET_CONFIRM_PIN,
      payload: pin,
    });
    navigate(NavigationActions.navigate({ routeName: LEGAL_TERMS }));
  };
};

export const backupWalletAction = () => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('wallet', {
      wallet: {
        backupStatus: { isBackedUp: true },
      },
    }));
    dispatch({
      type: BACKUP_WALLET,
    });
    dispatch(selfAwardBadgeAction('wallet-backed-up'));
  };
};

export const removePrivateKeyFromMemoryAction = () => {
  return async (dispatch: Function) => {
    dispatch({ type: REMOVE_PRIVATE_KEY });
  };
};

export const initSmartWalletSdkAction = (wallet: Object) => {
  return async (dispatch: Function) => {
    smartWalletService = new SmartWalletService();
    await smartWalletService.init(wallet.privateKey);
    dispatch({
      type: SET_SMART_WALLET_SDK_INIT,
      payload: true,
    });
  };
};

export const getSmartWalletAccountsAction = () => {
  return async (dispatch: Function) => {
    console.log('getSmartWalletAccountsAction');
    const accounts = await smartWalletService.getAccounts();
    dispatch({
      type: SET_SMART_WALLET_ACCOUNTS,
      payload: accounts,
    });
    const newAccountsPromises = accounts.map(
      async account => dispatch(addNewAccountAction(account.address, account)),
    );
    return Promise.all(newAccountsPromises);
  };
};

export const connectSmartWalletAccountAction = (account: SmartWalletAccount) => {
  return async (dispatch: Function) => {
    const connectedAccount = await smartWalletService.connectAccount(account.address);
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      payload: connectedAccount,
    });
  };
};

export const deploySmartWalletAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        connectedAccount: {
          address: accountAddress,
          state: accountState,
        },
      },
    } = getState();
    dispatch(setActiveAccountAction(accountAddress));
    if (accountState.toLowerCase() === 'deployed') {
      console.log('deploySmartWalletAction account is already deployed!');
      return;
    }
    const deployTxHash = await smartWalletService.deploy();
    console.log('deploySmartWalletAction deployTxHash: ', deployTxHash);
    // update accounts info
    dispatch(getSmartWalletAccountsAction());
    const account = await smartWalletService.fetchConnectedAccount();
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      account,
    });
  };
};

export const upgradeToSmartWalletAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        sdkInitialized,
      },
    } = getState();
    if (!sdkInitialized) {
      // TODO: sdk not initialized error
      console.log('sdk not initialized');
      return;
    }
    await dispatch(getSmartWalletAccountsAction());
    const {
      smartWallet: {
        accounts,
      },
    } = getState();
    if (!accounts.length) {
      // TODO: sdk accounts failed error
      console.log('no sdk accounts');
      return;
    }
    await dispatch(connectSmartWalletAccountAction(accounts[0]));
    // TODO: make transactions to smart wallet account address before deploy
    //  as balance check will fail during deploy if balance is 0
    // dispatch(deploySmartWalletAction());
  };
};

