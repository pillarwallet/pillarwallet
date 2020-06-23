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
import { ethers } from 'ethers';
import { NavigationActions } from 'react-navigation';
import shuffle from 'shuffle-array';
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';

// components
import Toast from 'components/Toast';

// constants
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
  UPDATE_PIN_ATTEMPTS,
  UPDATE_WALLET_STATE,
  IMPORTING,
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
} from 'constants/walletConstants';
import { PIN_CODE_CONFIRMATION, NEW_PROFILE, RECOVERY_SETTINGS } from 'constants/navigationConstants';

// utils
import { generateMnemonicPhrase, generateWordsToValidate, getSaltedPin } from 'utils/wallet';
import { findKeyBasedAccount, getAccountId } from 'utils/accounts';
import { delay } from 'utils/common';
import { setKeychainDataObject } from 'utils/keychain';

// services
import { navigate } from 'services/navigation';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';
import type { KeyChainData } from 'utils/keychain';
import type { BackupStatus } from 'reducers/walletReducer';

// actions
import { logEventAction } from './analyticsActions';
import { saveDbAction } from './dbActions';
import { selfAwardBadgeAction } from './badgesActions';
import { registerWalletAction } from './onboardingActions';
import { addWalletBackupEventAction } from './userEventsActions';
import { changeUseBiometricsAction } from './appSettingsActions';


export const importWalletFromTWordsPhraseAction = (tWordsPhrase: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: IMPORTING,
    });

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

      const payload = { importedWallet, apiUser };
      dispatch({ type: IMPORT_WALLET, payload });

      dispatch(logEventAction('wallet_imported', { method: 'Words Phrase' }));

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
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: IMPORTING,
    });

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

      const payload = { importedWallet, apiUser };
      dispatch({ type: IMPORT_WALLET, payload });

      dispatch(logEventAction('wallet_imported', { method: 'Private key' }));

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
  return (dispatch: Dispatch) => {
    dispatch({ type: RESET_WALLET_IMPORT });
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
  return (dispatch: Dispatch) => {
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
  return (dispatch: Dispatch) => {
    dispatch({
      type: NEW_WALLET_SET_PIN,
      payload: pin,
    });
    navigate(NavigationActions.navigate({ routeName: PIN_CODE_CONFIRMATION }));
  };
};

export const confirmPinForNewWalletAction = (pin: string, shouldRegisterWallet?: boolean) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { appSettings: { data: { themeType } } } = getState();
    dispatch({
      type: NEW_WALLET_CONFIRM_PIN,
      payload: pin,
    });

    if (shouldRegisterWallet) dispatch(registerWalletAction(false, themeType));
  };
};

export const backupWalletAction = () => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('wallet', {
      wallet: {
        backupStatus: { isBackedUp: true },
      },
    }));
    dispatch({ type: BACKUP_WALLET });
    dispatch(selfAwardBadgeAction('wallet-backed-up'));
    dispatch(addWalletBackupEventAction());

    dispatch(logEventAction('phrase_backed_up'));
  };
};

export const removePrivateKeyFromMemoryAction = () => ({ type: REMOVE_PRIVATE_KEY });

export const updatePinAttemptsAction = (isInvalidPin: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { wallet: { pinAttemptsCount } } = getState();
    const newCount = isInvalidPin ? pinAttemptsCount + 1 : 0;
    const currentTimeStamp = isInvalidPin ? Date.now() : 0;
    dispatch({
      type: UPDATE_PIN_ATTEMPTS,
      payload: {
        pinAttemptsCount: newCount,
        lastPinAttempt: currentTimeStamp,
      },
    });
    dispatch(saveDbAction('wallet', {
      wallet: {
        pinAttemptsCount: newCount,
        lastPinAttempt: currentTimeStamp,
      },
    }));
  };
};

export const encryptAndSaveWalletAction = (
  pin: string,
  wallet: ethers.Wallet,
  backupStatus: BackupStatus,
  enableBiometrics: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { wallet: { walletState } } = getState();
    const { isImported, isBackedUp, isRecoveryPending } = backupStatus;

    // might be already in ENCRYPTING state, i.e. on pin change
    if (walletState !== ENCRYPTING) {
      dispatch({ type: UPDATE_WALLET_STATE, payload: ENCRYPTING });
    }

    await delay(50);
    const saltedPin = await getSaltedPin(pin, dispatch);
    const encryptedWallet = await wallet.encrypt(saltedPin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    dispatch(saveDbAction('wallet', {
      wallet: {
        ...encryptedWallet,
        backupStatus: { isImported, isBackedUp, isRecoveryPending },
      },
    }));

    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: { address: wallet.address },
    });

    // save data to keychain
    const { mnemonic, privateKey } = wallet;
    const keychainData: KeyChainData = { mnemonic: mnemonic?.phrase || '', privateKey, pin };
    if (enableBiometrics) {
      await dispatch(changeUseBiometricsAction(true, keychainData, true));
    } else {
      await setKeychainDataObject(keychainData);
    }
  };
};

/**
 * wallet backup toast not needed if wallet is imported, backed up,
 * no key based account or key based account balances are 0
 */
export const checkForWalletBackupToastAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { backupStatus: { isImported, isBackedUp } },
      accounts: { data: accounts },
      balances: { data: balances },
    } = getState();

    const keyBasedAccount = findKeyBasedAccount(accounts);
    if (isImported || isBackedUp || !keyBasedAccount) return;

    const keyBasedAccountBalances = balances[getAccountId(keyBasedAccount)];
    const anyAssetHasPositiveBalance = !isEmpty(keyBasedAccountBalances)
      && Object.values(keyBasedAccountBalances).some((asset) => !!Number(get(asset, 'balance', 0)));
    if (!anyAssetHasPositiveBalance) return;

    const message =
      'Go to wallet settings on the assets screen and complete the wallet backup. ' +
      'Pillar cannot help you retrieve your wallet if it is lost.';

    Toast.show({
      message,
      type: 'warning',
      title: 'Please ensure you backup your wallet now',
      autoClose: false,
      onPress: () => {
        const action = NavigationActions.navigate({
          routeName: RECOVERY_SETTINGS,
        });
        navigate(action);
      },
    });
  };
};
