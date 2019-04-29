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
import {
  availableEnvironments,
  DeviceService,
  createSdk,
} from '@archanova/wallet-sdk';
import type {
  IEnvironment,
  ISdk,
} from '@archanova/wallet-sdk';
import InMemoryStorage from 'services/inMemoryStorage';

const storageNamespace = '@smartwallet';

export default class SmartWallet {
  sdk: ISdk;
  sdkStorage: Object;

  constructor() {
    this.sdkStorage = new InMemoryStorage({}, true);
    const config: IEnvironment = availableEnvironments
      .staging
      .extendOptions('storage', {
        namespace: storageNamespace,
        adapter: this.sdkStorage,
      });

    try {
      this.sdk = createSdk(config);
    } catch (err) {
      this.handleError(err);
    }
  }

  async init(privateKey: string) {
    const privateKeyStoragePath = `${storageNamespace}/${DeviceService.STORAGE_KEYS.privateKey}`;
    this.sdkStorage.setItem(privateKeyStoragePath, JSON.stringify({
      type: 'Buffer',
      data: privateKey.slice(2),
    }));
    await this.sdk
      .initialize()
      .catch(this.handleError);
    this.sdkStorage.removeItem(privateKeyStoragePath);
    // TODO: remove private from smart wallet sdk
  }

  async getAccounts() {
    let accounts = await this.sdk
      .getAccounts()
      .catch(this.handleError);
    if (!accounts || accounts.length === 0) {
      accounts = await this.sdk
        .createAccount()
        .catch(this.handleError);
    }
    return accounts;
  }

  async connectAccount(address: string) {
    const account = await this.sdk
      .connectAccount(address)
      .catch(this.handleError);
    const devices = await this.sdk
      .getAccountDevices()
      .catch(this.handleError);
    console.log('getAccountDevices', devices);
    return {
      ...account,
      devices,
    };
  }

  async deploy() {
    const gasPrice = await this.sdk.getGasPrice().catch(this.handleError);
    const deployEstimate = await this.sdk.estimateAccountDeployment(gasPrice).catch(this.handleError);
    console.log('deploy gasPrice: ', gasPrice);
    console.log('deploy deployEstimate: ', deployEstimate);
    return {};
  }

  handleError(error: any) {
    console.log('SmartWallet handleError: ', error);
  }
}
