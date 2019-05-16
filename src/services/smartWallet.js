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
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk,
  Sdk,
} from '@archanova/sdk';

export default class SmartWallet {
  sdk: Sdk;

  constructor() {
    const config = getSdkEnvironment(SdkEnvironmentNames.Ropsten);

    try {
      this.sdk = createSdk(config);
    } catch (err) {
      this.handleError(err);
    }
  }

  async init(privateKey: string) {
    await this.sdk.initialize({ device: { privateKey } }).catch(this.handleError);
    // TODO: remove private from smart wallet sdk
  }

  async getAccounts() {
    const accounts = await this.sdk.getConnectedAccounts()
      .then(({ items = [] }) => items)
      .catch(() => []);

    if (!accounts) {
      return [];
    }

    return accounts;
  }

  createAccount() {
    return this.sdk.createAccount().catch(() => null);
  }

  async connectAccount(address: string) {
    let account = this.sdk.state.account || await this.sdk.connectAccount(address).catch(this.handleError);
    const devices = await this.sdk.getConnectedAccountDevices()
      .then(({ items = [] }) => items)
      .catch(this.handleError);

    if (!account.ensName) {
      account = await this.sdk.updateAccount(account.address).catch(this.handleError);
    }

    return {
      ...account,
      devices,
    };
  }

  async deploy() {
    const deployEstimate = await this.sdk.estimateAccountDeployment().catch(this.handleError);
    let accountBalance = this.getAccountBalance();
    if (accountBalance.eq(0)) {
      // can't find a topUpAccount() method
      // await this.sdk.topUpAccount().catch(this.handleError);
      accountBalance = this.getAccountBalance();
    }
    if (accountBalance.gte(deployEstimate)) {
      return this.sdk.deployAccount();
    }
    console.log('insufficient balance, lack: ', deployEstimate.sub(accountBalance).toString());
    return {};
  }

  getAccountBalance() {
    const { state: { accountBalance } } = this.sdk;
    return accountBalance;
  }

  async fetchConnectedAccount() {
    const { state: { account } } = this.sdk;
    const devices = await this.sdk.getConnectedAccountDevices().catch(this.handleError);
    return {
      ...account,
      devices,
    };
  }

  handleError(error: any) {
    console.log('SmartWallet handleError: ', error);
  }
}
