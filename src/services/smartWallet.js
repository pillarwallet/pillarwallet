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
import get from 'lodash.get';
import {
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk,
  Sdk,
} from '@archanova/sdk';
import { BigNumber } from 'bignumber.js';
import { onSmartWalletSdkAction } from 'actions/smartWalletActions';

const SLOW = 'slow';
const REGULAR = 'regular';
const FAST = 'fast';

const TransactionSpeeds = {
  [SLOW]: SLOW,
  [REGULAR]: REGULAR,
  [FAST]: FAST,
};

type AccountTransaction = {
  recipient: string,
  value: number | string | BigNumber,
  data: string | Buffer,
  transactionSpeed?: $Keys<typeof TransactionSpeeds>,
};

let subscribedToEvents = false;

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

  async init(privateKey: string, dispatch?: Function) {
    await this.sdk.initialize({ device: { privateKey } }).catch(this.handleError);
    this.subscribeToEvents(dispatch);
    // TODO: remove private key from smart wallet sdk
  }

  subscribeToEvents(dispatch?: Function) {
    if (subscribedToEvents || !dispatch) return;
    this.sdk.event$.subscribe(event => {
      if (dispatch) dispatch(onSmartWalletSdkAction(event));
    });
    subscribedToEvents = true;
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
    const deployEstimate = await this.sdk.estimateAccountDeployment()
      .then(({ totalCost }) => totalCost)
      .catch(this.handleError);

    const accountBalance = this.getAccountBalance();
    if (deployEstimate && accountBalance.gte(deployEstimate)) {
      return this.sdk.deployAccount();
    }

    console.log('insufficient balance, lack: ', deployEstimate.sub(accountBalance).toString());
    return {};
  }

  getAccountBalance() {
    const accountBalance = get(this.sdk, 'state.account.balance.real', new BigNumber(0));
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

  async transferAsset(transaction: AccountTransaction) {
    let estimateError;
    const {
      recipient,
      value,
      data,
      transactionSpeed = null,
    } = transaction;

    const estimatedTransaction = await this.sdk.estimateAccountTransaction(
      recipient,
      value,
      data,
      transactionSpeed,
    ).catch((e) => { estimateError = e; });

    if (!estimatedTransaction) {
      return Promise.reject(new Error(estimateError));
    }

    return this.sdk.submitAccountTransaction(estimatedTransaction);
  }

  getConnectedAccountTransaction(txHash: string) {
    return this.sdk.getConnectedAccountTransaction(txHash);
  }

  handleError(error: any) {
    console.log('SmartWallet handleError: ', error);
  }
}
