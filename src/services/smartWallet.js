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
  sdkConstants,
  sdkModules,
} from '@archanova/sdk';
import { BigNumber } from 'bignumber.js';
import { utils } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { onSmartWalletSdkEventAction } from 'actions/smartWalletActions';
import { addressesEqual } from 'utils/assets';

const {
  Eth: {
    TransactionSpeeds: {
      Slow: SLOW,
      Regular: REGULAR,
      Fast: FAST,
    },
  },
} = sdkModules;

const TransactionSpeeds = {
  [SLOW]: SLOW,
  [REGULAR]: REGULAR,
  [FAST]: FAST,
};

const PAYMENT_COMPLETED = get(sdkConstants, 'AccountPaymentStates.Completed', '');

type AccountTransaction = {
  recipient: string,
  value: number | string | BigNumber,
  data: string | Buffer,
  transactionSpeed?: $Keys<typeof TransactionSpeeds>,
};

let subscribedToEvents = false;

class SmartWallet {
  sdk: Sdk;
  sdkInitialized: boolean = false;

  constructor() {
    const environmentNetwork = this.getEnvironmentNetwork(NETWORK_PROVIDER);
    const environment = getSdkEnvironment(environmentNetwork);

    try {
      this.sdk = createSdk(environment);
    } catch (err) {
      this.handleError(err);
    }
  }

  getEnvironmentNetwork(networkName: string) {
    // TODO: add support for the mainnet
    switch (networkName) {
      case 'rinkeby': return SdkEnvironmentNames.Rinkeby;
      case 'ropsten': return SdkEnvironmentNames.Ropsten;
      default: return SdkEnvironmentNames.Ropsten;
    }
  }

  async init(privateKey: string, dispatch?: Function) {
    if (this.sdkInitialized) return;

    await this.sdk
      .initialize({ device: { privateKey } })
      .then(() => { this.sdkInitialized = true; })
      .catch(this.handleError);

    if (this.sdkInitialized) {
      this.subscribeToEvents(dispatch);
    }
    // TODO: remove private key from smart wallet sdk
  }

  subscribeToEvents(dispatch?: Function) {
    if (subscribedToEvents || !dispatch) return;
    this.sdk.event$.subscribe(event => {
      if (dispatch) dispatch(onSmartWalletSdkEventAction(event));
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

    if (!account.ensName && account.state === sdkConstants.AccountStates.Created) {
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

    const accountBalance = this.getAccountRealBalance();
    if (deployEstimate && accountBalance.gte(deployEstimate)) {
      return this.sdk.deployAccount();
    }

    console.log('insufficient balance, lack: ', deployEstimate.sub(accountBalance).toString());
    return null;
  }

  getAccountRealBalance() {
    return get(this.sdk, 'state.account.balance.real', new BigNumber(0));
  }

  getAccountVirtualBalance() {
    return get(this.sdk, 'state.account.balance.virtual', new BigNumber(0));
  }

  getAccountStakedAmount(tokenAddress: ?string): BigNumber {
    return this.sdk.getConnectedAccountVirtualBalance(tokenAddress)
      .then(data => {
        let value;
        if (data.items) { // NOTE: we're getting the data.items response when tokenAddress is null
          value = get(data, 'items[0].value');
        } else {
          value = get(data, 'value');
        }
        return value || new BigNumber(0);
      })
      .catch((e) => {
        this.handleError(e);
        return new BigNumber(0);
      });
  }

  getAccountPendingBalances() {
    return this.sdk.getConnectedAccountVirtualPendingBalances()
      .catch((e) => {
        this.handleError(e);
        return [];
      });
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

  createAccountPayment(recipient: string, token: ?string, value: number | string) {
    return this.sdk.createAccountPayment(recipient, token, value);
  }

  getConnectedAccountTransaction(txHash: string) {
    return this.sdk.getConnectedAccountTransaction(txHash);
  }

  estimateTopUpAccountVirtualBalance(value: BigNumber, tokenAddress: ?string) {
    return this.sdk.estimateTopUpAccountVirtualBalance(value, tokenAddress);
  }

  estimateWithdrawFromAccountVirtualBalance(value: BigNumber) {
    return this.sdk.estimateWithdrawFromAccountVirtualBalance(value);
  }

  estimateWithdrawAccountPayment(hashes: string[] = []) {
    const items = hashes.length === 1 ? hashes[0] : hashes;
    return this.sdk.estimateWithdrawAccountPayment(items);
  }

  topUpAccountVirtualBalance(estimated: Object) {
    return this.sdk.submitAccountTransaction(estimated);
  }

  withdrawAccountVirtualBalance(estimated: Object) {
    return this.sdk.submitAccountTransaction(estimated);
  }

  withdrawAccountPayment(estimated: Object) {
    return this.sdk.submitAccountTransaction(estimated);
  }

  searchAccount(address: string) {
    return this.sdk.searchAccount({ address });
  }

  async getAccountPayments(lastSyncedHash: ?string, page?: number = 0) {
    const data = await this.sdk.getConnectedAccountPayments(page).catch(this.handleError);
    if (!data) return [];

    const foundLastSyncedTx = lastSyncedHash
      ? data.items.find(({ hash }) => hash === lastSyncedHash)
      : null;
    if (data.nextPage && !foundLastSyncedTx) {
      return [...data.items, ...(await this.getAccountPayments(lastSyncedHash, page + 1))];
    }

    return data.items;
  }

  async getAccountPaymentsToSettle(accountAddress: string, page?: number = 0) {
    const data = await this.sdk.getConnectedAccountPayments(page).catch(this.handleError);
    if (!data) return [];

    const items = data.items
      .filter(payment => payment.state === PAYMENT_COMPLETED)
      .filter(payment => {
        const recipientAddress = get(payment, 'recipient.account.address', '');
        return addressesEqual(recipientAddress, accountAddress);
      });

    if (data.nextPage) {
      return [...items, ...(await this.getAccountPaymentsToSettle(accountAddress, page + 1))];
    }

    return items;
  }

  getDeployEstimate(gasPrice: BigNumber) {
    /**
     * can also call `this.sdk.estimateAccountDeployment(REGULAR);`,
     * but it needs sdk init and when migrating we don't have SDK initiated yet
     * so we're using calculation method below that is provided by SDK creators
     */
    return utils.bigNumberify(650000).mul(gasPrice);
  }

  handleError(error: any) {
    console.error('SmartWallet handleError: ', error);
  }
}

const smartWalletInstance = new SmartWallet();
export default smartWalletInstance;
