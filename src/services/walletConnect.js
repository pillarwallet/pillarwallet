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
import WalletConnect from '@walletconnect/client';
import { Core } from '@walletconnect/core';
import { IWeb3Wallet, Web3Wallet } from '@walletconnect/web3wallet';
import { getSdkError } from '@walletconnect/utils';

// Configs
import { getEnv } from 'configs/envConfig';

// utils
import { reportErrorLog } from 'utils/common';

// services
import Storage from 'services/storage';

// types
import type {
  WalletConnectSession,
  WalletConnectConnector,
  WalletConnectOptions,
} from 'models/WalletConnect';

// eslint-disable-next-line import/no-mutable-exports
export let web3wallet: IWeb3Wallet;
// eslint-disable-next-line import/no-mutable-exports
export let core;
// eslint-disable-next-line import/no-mutable-exports
export let signClient;

/* eslint-disable i18next/no-literal-string */
const clientMeta = {
  name: 'Pillar Wallet',
  description: 'Social. Secure. Intuitive.',
  url: 'https://pillarproject.io/wallet',
  icons: [
    'https://is3-ssl.mzstatic.com/image/thumb/Purple113/v4/8c/36/c7/8c36c7d5-0698-97b5-13b2-a51564706cf5/AppIcon-1x_U007emarketing-85-220-0-6.png/460x0w.jpg',
  ],
};
/* eslint-enable i18next/no-literal-string */

export async function createWeb3Wallet() {
  core = new Core({
    projectId: getEnv().WALLETCONNECT_PROJECT_ID,
  });

  web3wallet = await Web3Wallet.init({
    core,
    metadata: clientMeta,
  });

  return web3wallet;
}

export async function web3WalletInit() {
  const newCore = new Core({
    projectId: getEnv().WALLETCONNECT_PROJECT_ID,
  });

  const wcInit = await Web3Wallet.init({
    core: newCore,
    metadata: clientMeta,
  });
  return wcInit;
}

export async function web3WalletPair(options: WalletConnectOptions) {
  try {
    const pair = await web3wallet.core.pairing.pair({ ...options });
    return pair;
  } catch (error) {
    reportErrorLog('walletConnect -> web3WalletPair V2 failed', { error });
    return null;
  }
}

export const createConnector = (options: WalletConnectOptions): ?WalletConnectConnector => {
  try {
    return new WalletConnect({ ...options, clientMeta });
  } catch (error) {
    reportErrorLog('walletConnect -> createConnector failed', { error });
    return null;
  }
};

export const loadLegacyWalletConnectSessions = async (): Promise<WalletConnectSession[]> => {
  const storage = Storage.getInstance('db');
  const walletConnectStorage = await storage.get('walletconnect');

  return walletConnectStorage?.sessions ?? [];
};

export const disconnectV2Session = async (topic: string) => {
  await web3wallet.disconnectSession({
    topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
};
