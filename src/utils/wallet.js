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
import { convertUtf8ToHex, isHexString } from '@walletconnect/utils';
import { getEnv } from 'configs/envConfig';
import { toBuffer, keccak256, bufferToHex } from 'ethereumjs-util';
// eslint-disable-next-line camelcase
import { TypedDataUtils, signTypedData_v4 } from 'eth-sig-util';

import { getRandomInt, getEthereumProvider, printLog, reportLog, reportErrorLog } from 'utils/common';
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
    walletAddress = `0x${walletAddress}`; // eslint-disable-line i18next/no-literal-string
  }
  return walletAddress;
}

export function catchTransactionError(e: Object, type: string, tx: Object) {
  reportErrorLog('Exception in wallet transaction', {
    tx,
    type,
    error: e.message,
  });
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

export function encodePersonalMessage(message: string): string {
  const data = toBuffer(convertUtf8ToHex(message));

  const buf = Buffer.concat([
    Buffer.from("\x19Ethereum Signed Message:\n" + data.length.toString(), "utf8"), // eslint-disable-line
    data,
  ]);

  return bufferToHex(buf);
}

export function hashPersonalMessage(message: string): string {
  const data = encodePersonalMessage(message);

  const buf = toBuffer(data);
  const hash = keccak256(buf);

  return bufferToHex(hash);
}

// handle eth_sign
export function signMessage(
  message: any,
  walletInstance: Object,
): string {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);

  const data = isHexString(message) ? ethers.utils.arrayify(message) : message;

  return wallet.signMessage(data);
}

// handle personal_sign
export function signPersonalMessage(
  messageHex: string,
  walletInstance: Object,
  isLegacyEip1271: boolean = false, // EIP-1271 had few proposals that went live
): Promise<string> {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);

  let data = messageHex;
  if (isLegacyEip1271) {
    const actualMessage = ethers.utils.toUtf8String(messageHex);
    data = hashPersonalMessage(actualMessage);
  }

  return wallet.signMessage(ethers.utils.arrayify(data));
}

export function encodeTypedDataMessage(message: string): string {
  const useV4 = true;

  const data = TypedDataUtils.sanitizeData(JSON.parse(message));

  const buf = Buffer.concat([
    Buffer.from('1901', 'hex'),
    TypedDataUtils.hashStruct('EIP712Domain', data.domain, data.types, useV4), // eslint-disable-line
    TypedDataUtils.hashStruct(data.primaryType.toString(), data.message, data.types, useV4),
  ]);

  return bufferToHex(buf);
}

export function hashTypedDataMessage(message: string): string {
  const data = encodeTypedDataMessage(message);

  const buf = toBuffer(data);
  const hash = keccak256(buf);

  return bufferToHex(hash);
}

// handle eth_signTypedData
export function signTypedData(
  data: string,
  walletInstance: Object,
  isLegacyEip1271: boolean = false, // EIP-1271 had few proposals that went live
): Promise<string> {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const wallet = walletInstance.connect(provider);

  if (isLegacyEip1271) {
    const hashedTypedData = hashTypedDataMessage(data);
    return wallet.signMessage(ethers.utils.arrayify(hashedTypedData));
  }

  return signTypedData_v4(toBuffer(wallet.privateKey), { data: JSON.parse(data) });
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
