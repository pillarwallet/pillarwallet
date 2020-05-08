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
import { ethers, utils } from 'ethers';
import DeviceInfo from 'react-native-device-info';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';
import * as Sentry from '@sentry/react-native';
import { isHexString } from '@walletconnect/utils';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import AsyncStorage from '@react-native-community/async-storage';

import {
  getRandomInt,
  ethSign,
  getEthereumProvider,
  printLog,
  reportLog,
} from 'utils/common';
import Storage from 'services/storage';
import { saveDbAction } from 'actions/dbActions';
import { WALLET_STORAGE_BACKUP_KEY } from 'constants/walletConstants';
import type { Dispatch } from 'reducers/rootReducer';

const storage = Storage.getInstance('db');

export function generateMnemonicPhrase(mnemonicPhrase?: string) {
  return mnemonicPhrase || utils.HDNode.entropyToMnemonic(utils.randomBytes(16));
}

export function generateWordsToValidate(numWordsToGenerate: number, maxWords: number) {
  const chosenWords = [];
  while (chosenWords.length < numWordsToGenerate) {
    const randomNumber = getRandomInt(1, maxWords);
    if (chosenWords.includes(randomNumber)) continue; // eslint-disable-line
    chosenWords.push(randomNumber);
  }
  chosenWords.sort((a, b) => a - b);
  return chosenWords;
}

export async function getSaltedPin(pin: string, dispatch: Function): Promise<string> {
  let { deviceUniqueId = null } = await storage.get('deviceUniqueId') || {};
  if (!deviceUniqueId) {
    deviceUniqueId = DeviceInfo.getUniqueId();
    await dispatch(saveDbAction('deviceUniqueId', { deviceUniqueId }, true));
  }
  return deviceUniqueId + pin + deviceUniqueId.slice(0, 5);
}

export function normalizeWalletAddress(walletAddress: string): string {
  if (walletAddress.indexOf('0x') !== 0) {
    walletAddress = `0x${walletAddress}`;
  }
  return walletAddress;
}

export function catchTransactionError(e: Object, type: string, tx: Object) {
  reportLog('Exception in wallet transaction', {
    tx,
    type,
    error: e.message,
  }, Sentry.Severity.Error);
  return { error: e.message };
}

// handle eth_signTransaction
export function signTransaction(trx: Object, walletInstance: Object): Promise<string> {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);
  const signTx = trx ? { ...trx } : trx;
  if (signTx && signTx.from) {
    delete signTx.from;
  }
  return wallet.sign(signTx);
}

// handle eth_sign
export function signMessage(message: any, walletInstance: Object): string {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);
  // TODO: this method needs to be replaced when ethers.js is migrated to v4.0
  return ethSign(message, wallet.privateKey);
}

// handle personal_sign
export function signPersonalMessage(message: string, walletInstance: Object): Promise<string> {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);
  return wallet.signMessage(isHexString(message) ? ethers.utils.arrayify(message) : message);
}

// we use basic AsyncStorage implementation just to prevent backup being stored in same manner
export async function getWalletFromStorage(storageData: Object, dispatch: Dispatch, api: Object) {
  let { wallet = {} } = get(storageData, 'wallet', {});
  const { appSettings = {} } = get(storageData, 'app_settings', {});
  const { user = {} } = get(storageData, 'user', {});
  const walletBackup = await AsyncStorage.getItem(WALLET_STORAGE_BACKUP_KEY);
  const isWalletEmpty = isEmpty(wallet);
  // wallet timestamp missing causes welcome screen
  let walletTimestamp = appSettings.wallet;
  const reportToSentry = (message, data = {}) => reportLog(message, {
    walletHadBackup: !!walletBackup,
    isWalletEmpty,
    walletCreationTimestamp: appSettings.wallet,
    isAppSettingsEmpty: isEmpty(appSettings),
    ...data,
  });
  // restore wallet if one is empty and backup is present
  if (isWalletEmpty && walletBackup) {
    printLog('RESTORING WALLET FROM BACKUP');
    // restore wallet to storage
    try {
      wallet = JSON.parse(walletBackup);
      dispatch(saveDbAction('wallet', { wallet }));
    } catch (e) {
      reportToSentry('Wallet parse failed', {
        walletHadBackup: true,
        walletBackupParseError: e,
      });
    }
  }
  // we can only set new timestamp if any wallet is present (existing or backup)
  if (!walletTimestamp && (!isWalletEmpty || walletBackup)) {
    walletTimestamp = +new Date();
    printLog('SETTING NEW WALLET TIMESTAMP');
    // only wallet timestamp was missing, let's update it to storage
    dispatch(saveDbAction('app_settings', { appSettings: { wallet: walletTimestamp } }));
  }

  const walletAsString = !isWalletEmpty && JSON.stringify(wallet);
  // check backup and store if needed
  if (!!walletAsString && !isEqual(walletAsString, walletBackup)) {
    // wallet has changed or backup does not exist, let's update it
    await AsyncStorage.setItem(WALLET_STORAGE_BACKUP_KEY, walletAsString);
  }

  if (isEmpty(user) || !user.username || !user.walletId) {
    printLog('EMPTY USER OBJECT DETECTED');
    if (!isEmpty(wallet)) {
      printLog('RESTORING USER FROM API');
      api.init();
      const apiUser = await api.validateAddress(normalizeWalletAddress(wallet.address));
      if (apiUser.walletId) {
        const restoredUser = {
          id: apiUser.id,
          walletId: apiUser.walletId,
          username: apiUser.username,
          profileLargeImage: apiUser.profileImage,
        };
        await dispatch(saveDbAction('user', { user: restoredUser }, true));
        printLog('USER RESTORED FROM API');
      } else {
        printLog('UNABLE TO RESTORE USER FROM API');
      }
    } else {
      printLog('WALLET OBJECT IS STILL EMPTY');
    }
  }

  // we check for previous value of `appSettings.wallet` as by this point `walletTimestamp` can be already set.
  // in that part we report a case if either wallet was empty or wallet timestamp AND we additionally check
  // if the walletBackup is present because this would conflict with onboarding flow and will report to sentry
  // because both wallet and wallet timestamp will be empty
  if (walletBackup && (isWalletEmpty || !appSettings.wallet)) reportToSentry('Wallet login issue spotted');

  return {
    wallet,
    walletTimestamp,
  };
}

export async function decryptWallet(encryptedWallet: Object, saltedPin: string, options?: Object) {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  let wallet = await ethers.Wallet.RNfromEncryptedJson(JSON.stringify(encryptedWallet), saltedPin, options);
  if (wallet) {
    wallet = wallet.connect(provider);
  }
  return wallet;
}

export function constructWalletFromPrivateKey(privateKey: string): Object {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  let wallet = new ethers.Wallet(privateKey);
  if (wallet) {
    wallet = wallet.connect(provider);
  }
  return wallet;
}

export function constructWalletFromMnemonic(mnemonic: string): Object {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  let wallet = ethers.Wallet.fromMnemonic(mnemonic);
  if (wallet) {
    wallet = wallet.connect(provider);
  }
  return wallet;
}

export async function getPrivateKeyFromPin(pin: string, dispatch: Dispatch) {
  const { wallet: encryptedWallet } = await storage.get('wallet');
  const saltedPin = await getSaltedPin(pin, dispatch);
  const wallet = await decryptWallet(encryptedWallet, saltedPin);
  return get(wallet, 'signingKey.privateKey');
}
