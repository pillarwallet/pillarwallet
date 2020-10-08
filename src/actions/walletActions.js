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
import t from 'translations/translate';

// components
import Toast from 'components/Toast';

// constants
import {
  UPDATE_WALLET_MNEMONIC,
  REMOVE_WALLET_PRIVATE_KEY,
  UPDATE_PIN_ATTEMPTS,
  UPDATE_WALLET_BACKUP_STATUS,
  SET_WALLET_IS_ENCRYPTING,
} from 'constants/walletConstants';
import { WALLET_SETTINGS } from 'constants/navigationConstants';

// utils
import { generateMnemonicPhrase, generateWordsToValidate, getSaltedPin } from 'utils/wallet';
import { findKeyBasedAccount, getAccountId } from 'utils/accounts';
import { setKeychainDataObject } from 'utils/keychain';

// services
import { navigate } from 'services/navigation';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { KeyChainData } from 'utils/keychain';
import type { BackupStatus } from 'reducers/walletReducer';

// actions
import { logEventAction } from './analyticsActions';
import { saveDbAction } from './dbActions';
import { selfAwardBadgeAction } from './badgesActions';
import { addWalletBackupEventAction } from './userEventsActions';
import { changeUseBiometricsAction } from './appSettingsActions';


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

export const backupWalletAction = () => {
  return (dispatch: Dispatch) => {
    dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: { isBackedUp: true } });
    dispatch(saveDbAction('wallet', { wallet: { backupStatus: { isBackedUp: true } } }));

    dispatch(selfAwardBadgeAction('wallet-backed-up'));
    dispatch(addWalletBackupEventAction());

    dispatch(logEventAction('phrase_backed_up'));
  };
};

export const removePrivateKeyFromMemoryAction = () => ({ type: REMOVE_WALLET_PRIVATE_KEY });

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
    dispatch(saveDbAction('pinAttempt', {
      pinAttempt: {
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
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_WALLET_IS_ENCRYPTING, payload: true });

    const saltedPin = await getSaltedPin(pin, dispatch);
    const encryptedWallet = await wallet.encrypt(saltedPin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    dispatch(saveDbAction('wallet', {
      wallet: {
        ...encryptedWallet,
        backupStatus,
      },
    }));

    // save data to keychain
    const { mnemonic, privateKey } = wallet;
    const keychainData: KeyChainData = { mnemonic: mnemonic?.phrase || '', privateKey, pin };
    if (enableBiometrics) {
      await dispatch(changeUseBiometricsAction(true, keychainData, true));
    } else {
      await setKeychainDataObject(keychainData);
    }

    dispatch({ type: SET_WALLET_IS_ENCRYPTING, payload: false });
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

    Toast.show({
      message: t('toast.ensureBackup'),
      emoji: 'point_up',
      autoClose: false,
      onPress: () => {
        const action = NavigationActions.navigate({
          routeName: WALLET_SETTINGS,
        });
        navigate(action);
      },
    });
  };
};
