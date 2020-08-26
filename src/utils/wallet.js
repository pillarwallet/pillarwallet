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
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';
import * as Sentry from '@sentry/react-native';
import { isHexString } from '@walletconnect/utils';
import { getEnv } from 'configs/envConfig';

import {
  getRandomInt,
  ethSign,
  getEthereumProvider,
  printLog,
  reportLog,
} from 'utils/common';
import Storage from 'services/storage';
import { saveDbAction } from 'actions/dbActions';
import type { Dispatch } from 'reducers/rootReducer';

const storage = Storage.getInstance('db');

export function generateMnemonicPhrase(mnemonicPhrase?: string) {
  return mnemonicPhrase || utils.entropyToMnemonic(utils.randomBytes(16));
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
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);
  const signTx = trx ? { ...trx } : trx;
  if (signTx && signTx.from) {
    delete signTx.from;
  }
  return wallet.signTransaction(signTx);
}

// handle eth_sign
export function signMessage(message: any, walletInstance: Object): string {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);
  // TODO: this method needs to be replaced when ethers.js is migrated to v4.0
  return ethSign(message, wallet.privateKey);
}

// handle personal_sign
export function signPersonalMessage(message: string, walletInstance: Object): Promise<string> {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);
  return wallet.signMessage(isHexString(message) ? ethers.utils.arrayify(message) : message);
}

export async function getWalletFromStorage(storageData: Object, dispatch: Dispatch) {
  const { wallet = {} } = get(storageData, 'wallet', {});
  const { appSettings = {} } = get(storageData, 'app_settings', {});
  const isWalletEmpty = isEmpty(wallet);

  // missing wallet timestamp causes 'welcome screen'
  let walletTimestamp = appSettings.wallet;

  const reportToSentry = (message, data = {}) => reportLog(message, {
    isWalletEmpty,
    walletCreationTimestamp: appSettings.wallet,
    isAppSettingsEmpty: isEmpty(appSettings),
    ...data,
  });

  // we can only set the new timestamp if the wallet is present
  if (!walletTimestamp && !isWalletEmpty) {
    walletTimestamp = +new Date();
    printLog('SETTING NEW WALLET TIMESTAMP');
    // if only the wallet timestamp was missing, let's update it
    dispatch(saveDbAction('app_settings', { appSettings: { wallet: walletTimestamp } }));
    reportToSentry('Empty wallet timestamp (auto-fix)');
  }

  return {
    wallet,
    walletTimestamp,
  };
}

export async function decryptWallet(encryptedWallet: Object, saltedPin: string) {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  let wallet = await ethers.Wallet.fromEncryptedJson(JSON.stringify(encryptedWallet), saltedPin);
  if (wallet) {
    wallet = wallet.connect(provider);
  }
  return wallet;
}

export function constructWalletFromPrivateKey(privateKey: string): Object {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  let wallet = new ethers.Wallet(privateKey);
  if (wallet) {
    wallet = wallet.connect(provider);
  }
  return wallet;
}

export function constructWalletFromMnemonic(mnemonic: string): Object {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
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
