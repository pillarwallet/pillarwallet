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
import t from 'translations/translate';

// Components
import Toast from 'components/Toast';

// Constants
import {
  REMOVE_WALLET_PRIVATE_KEY,
  UPDATE_PIN_ATTEMPTS,
  UPDATE_WALLET_BACKUP_STATUS,
  SET_WALLET_IS_ENCRYPTING,
  TODAY_FAILED_ATTEMPTS,
} from 'constants/walletConstants';
import { MENU_SETTINGS } from 'constants/navigationConstants';

// Utils
import { getSaltedPin } from 'utils/wallet';
import { setKeychainDataObject } from 'utils/keychain';
import { getDeviceUniqueId } from 'utils/device';

// Services
import { navigate } from 'services/navigation';

// Types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { KeyChainData } from 'utils/keychain';
import type { BackupStatus } from 'reducers/walletReducer';

// Actions
import { logEventAction } from './analyticsActions';
import { saveDbAction } from './dbActions';
import { addWalletBackupEventAction } from './walletEventsActions';
import { changeUseBiometricsAction, setDeviceUniqueIdIfNeededAction } from './appSettingsActions';

export const backupWalletAction = () => {
  return (dispatch: Dispatch) => {
    dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: { isBackedUp: true } });
    dispatch(saveDbAction('wallet', { wallet: { backupStatus: { isBackedUp: true } } }));

    dispatch(addWalletBackupEventAction());

    dispatch(logEventAction('phrase_backed_up'));
  };
};

export const removePrivateKeyFromMemoryAction = () => ({ type: REMOVE_WALLET_PRIVATE_KEY });

export const updatePinAttemptsAction = (isInvalidPin: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { pinAttemptsCount, failedAttempts },
    } = getState();
    const newCount = isInvalidPin ? pinAttemptsCount + 1 : 0;
    dispatch({
      type: UPDATE_PIN_ATTEMPTS,
      payload: {
        pinAttemptsCount: newCount,
      },
    });

    const { numberOfFailedAttempts, date } = failedAttempts;

    const isSameDay = new Date(date)?.toDateString() === new Date()?.toDateString();
    dispatch(
      saveDbAction('pinAttempt', {
        pinAttempt: {
          pinAttemptsCount: newCount,
        },
        failedAttempts: {
          numberOfFailedAttempts,
          date: isSameDay ? date : new Date(),
        },
      }),
    );

    if (newCount > 2 + numberOfFailedAttempts) {
      dispatch({
        type: TODAY_FAILED_ATTEMPTS,
        payload: {
          failedAttempts: {
            numberOfFailedAttempts: numberOfFailedAttempts + 1,
            date: new Date(),
          },
        },
      });
      dispatch(
        saveDbAction('pinAttempt', {
          pinAttempt: {
            pinAttemptsCount: 0,
          },
          failedAttempts: {
            numberOfFailedAttempts: numberOfFailedAttempts + 1,
            date: new Date(),
          },
        }),
      );
      dispatch({
        type: UPDATE_PIN_ATTEMPTS,
        payload: {
          pinAttemptsCount: 0,
        },
      });
    }
  };
};

export const encryptAndSaveWalletAction = (
  pin: string,
  wallet: ethers.Wallet,
  backupStatus: BackupStatus,
  enableBiometrics: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_WALLET_IS_ENCRYPTING, payload: true });

    const deviceUniqueId = getState().appSettings.data.deviceUniqueId ?? (await getDeviceUniqueId());
    dispatch(setDeviceUniqueIdIfNeededAction(deviceUniqueId));

    const saltedPin = await getSaltedPin(pin, deviceUniqueId);
    const encryptedWallet = await wallet
      .encrypt(saltedPin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    dispatch(
      saveDbAction('wallet', {
        wallet: {
          ...encryptedWallet,
          backupStatus,
          pinV2: true, // pin digits count changed
        },
      }),
    );

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
      wallet: {
        backupStatus: { isImported, isBackedUp },
      },
    } = getState();

    if (isImported || isBackedUp) return;

    Toast.show({
      message: t('toast.ensureBackup'),
      emoji: 'point_up',
      autoClose: true,
      onPress: () => {
        const action = NavigationActions.navigate({
          routeName: MENU_SETTINGS,
        });
        navigate(action);
      },
    });
  };
};
