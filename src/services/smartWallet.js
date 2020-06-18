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
  sdkInterfaces,
} from '@smartwallet/sdk';
import { ethToWei, toChecksumAddress } from '@netgum/utils';
import { BigNumber } from 'bignumber.js';
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import * as Sentry from '@sentry/react-native';
import isEmpty from 'lodash.isempty';
import abi from 'ethjs-abi';

// constants
import { ETH } from 'constants/assetsConstants';

// utils
import { addressesEqual } from 'utils/assets';
import { normalizeForEns } from 'utils/accounts';
import { printLog, reportLog, reportOrWarn } from 'utils/common';

// types
import type { ConnectedSmartWalletAccount, SmartWalletAccount } from 'models/SmartWalletAccount';
import type SDKWrapper from 'services/api';
import type { AssetData } from 'models/Asset';
import type { EstimatedTransactionFee, GasToken } from 'models/Transaction';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';


const {
  GasPriceStrategies: {
    Avg: AVG,
    Fast: FAST,
  },
} = sdkConstants;

const TransactionSpeeds = {
  [AVG]: AVG,
  [FAST]: FAST,
};

const PAYMENT_COMPLETED = get(sdkConstants, 'AccountPaymentStates.Completed', '');

export type AccountTransaction = {
  recipient: string,
  value: number | string | BigNumber,
  data?: string | Buffer,
  transactionSpeed?: $Keys<typeof TransactionSpeeds>,
  gasToken?: ?GasToken,
};

export type EstimatePayload = {
  gasFee: BigNumber,
  signedGasPrice: {
    gasPrice: BigNumber,
  },
  signedGasTokenCost?: sdkInterfaces.ISignedGasTokenCost;
  gasToken: sdkInterfaces.IGasToken;
  relayerVersion: number;
  relayerFeatures: sdkInterfaces.RelayerFeatures;
};

type ParsedEstimate = {
  gasAmount: ?BigNumber,
  gasPrice: ?BigNumber,
  totalCost: ?BigNumber,
  gasToken: ?sdkInterfaces.IGasToken,
  gasTokenCost: ?BigNumber,
  relayerFeatures: ?sdkInterfaces.RelayerFeatures;
};

let subscribedToEvents = false;

export const parseEstimatePayload = (estimatePayload: EstimatePayload): ParsedEstimate => {
  const gasAmount = get(estimatePayload, 'gasFee');
  const gasToken = get(estimatePayload, 'gasToken');
  const gasPrice = get(estimatePayload, 'signedGasPrice.gasPrice');
  const gasTokenCost = get(estimatePayload, 'signedGasTokenCost.gasTokenCost');
  const relayerFeatures = get(estimatePayload, 'relayerFeatures');
  return {
    gasAmount,
    gasPrice,
    totalCost: gasAmount && gasPrice && gasPrice.mul(gasAmount),
    gasToken,
    gasTokenCost,
    relayerFeatures,
  };
};

export const formatEstimated = (estimated: ParsedEstimate) => {
  let { gasTokenCost, totalCost } = estimated;
  const { gasToken, relayerFeatures } = estimated;
  const hasGasTokenSupport = get(relayerFeatures, 'gasTokenSupported', false);

  // NOTE: change all numbers to app used `BigNumber` lib as it is different between SDK and ethers
  gasTokenCost = new BigNumber(gasTokenCost ? gasTokenCost.toString() : 0);
  totalCost = new BigNumber(totalCost ? totalCost.toString() : 0);

  return {
    ethCost: totalCost,
    gasTokenCost: hasGasTokenSupport ? gasTokenCost : null,
    gasToken: hasGasTokenSupport ? gasToken : null,
  };
};

class SmartWallet {
  sdk: Sdk;
  sdkInitialized: boolean = false;

  constructor() {
    const environmentNetwork = this.getEnvironmentNetwork(NETWORK_PROVIDER);
    const sdkOptions = getSdkEnvironment(environmentNetwork);
    try {
      this.sdk = createSdk(sdkOptions);
    } catch (err) {
      this.handleError(err);
    }
  }

  getEnvironmentNetwork(networkName: string) {
    switch (networkName) {
      case 'rinkeby': return SdkEnvironmentNames.Rinkeby;
      case 'ropsten': return SdkEnvironmentNames.Ropsten;
      case 'homestead': return SdkEnvironmentNames.Main;
      default: return SdkEnvironmentNames.Ropsten;
    }
  }

  async init(privateKey: string, onEvent?: Function) {
    if (this.sdkInitialized) return;

    await this.sdk
      .initialize({ device: { privateKey } })
      .then(() => { this.sdkInitialized = true; })
      .catch(() => {
        printLog('Error initiating sdk.');
      });

    if (this.sdkInitialized) {
      this.subscribeToEvents(onEvent);
    }
    // TODO: remove private key from smart wallet sdk
  }

  subscribeToEvents(onEvent?: Function) {
    if (subscribedToEvents || !onEvent) return;
    this.sdk.event$.subscribe(event => {
      if (onEvent) onEvent(event);
    });
    subscribedToEvents = true;
  }

  async getAccounts(): Promise<SmartWalletAccount[]> {
    const accounts = await this.sdk.getConnectedAccounts()
      .then(({ items = [] }) => items)
      .catch(() => []);

    if (!accounts) {
      return [];
    }

    return accounts;
  }

  createAccount(username: string) {
    const ensName = normalizeForEns(username);
    return this.sdk
      .createAccount(ensName)
      .catch((e) => {
        this.reportError('Unable to create Smart Account', { username, e });
        return null;
      });
  }

  getConnectedAccountDevices() {
    return this.sdk.getConnectedAccountDevices()
      .then((result) => get(result, 'items', []))
      .catch(this.handleError);
  }

  async connectAccount(address: string) {
    if (!get(this.sdk, 'state.account')) {
      await this.sdk.connectAccount(address).catch(this.handleError);
    }

    return this.fetchConnectedAccount();
  }

  async syncSmartAccountsWithBackend(
    api: SDKWrapper,
    smartAccounts: SmartWalletAccount[],
    walletId: string,
    privateKey: string,
    fcmToken: string,
  ) {
    const backendAccounts = await api.listAccounts(walletId);
    const registerOnBackendPromises = smartAccounts.map(async account => {
      const backendAccount = backendAccounts.some(({ ethAddress }) => addressesEqual(ethAddress, account.address));
      if (!backendAccount) {
        return api.registerSmartWallet({
          walletId,
          privateKey,
          ethAddress: account.address,
          fcmToken: fcmToken || '',
        });
      }
      return Promise.resolve();
    });
    return Promise
      .all(registerOnBackendPromises)
      .catch(e => this.reportError('Unable to sync smart wallets', { e }));
  }

  async deployAccount() {
    const deployEstimate = await this.sdk.estimateAccountDeployment().catch(this.handleError);
    return this.sdk.deployAccount(deployEstimate, false)
      .then((hash) => ({ deployTxHash: hash }))
      .catch((e) => {
        this.reportError('Unable to deploy account', { e });
        return { error: e.message };
      });
  }

  async deployAccountDevice(deviceAddress: string, payForGasWithToken: boolean = false) {
    const deployEstimate = await this.sdk.estimateAccountDeviceDeployment(deviceAddress).catch(this.handleError);
    return this.sdk.submitAccountTransaction(deployEstimate, payForGasWithToken)
      .catch((e) => {
        this.reportError('Unable to deploy device', { e });
        return null;
      });
  }

  async unDeployAccountDevice(deviceAddress: string, payForGasWithToken: boolean = false) {
    const unDeployEstimate = await this.sdk.estimateAccountDeviceUnDeployment(deviceAddress).catch(this.handleError);
    return this.sdk.submitAccountTransaction(unDeployEstimate, payForGasWithToken)
      .catch((e) => {
        this.reportError('Unable to undeploy device', { e });
        return null;
      });
  }

  getAccountStakedAmount(tokenAddress: ?string): BigNumber {
    if (!tokenAddress) return new BigNumber(0);
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

  async fetchConnectedAccount(): Promise<ConnectedSmartWalletAccount> {
    try {
      const { state: { account: accountData } } = this.sdk;
      const devices = await this.getConnectedAccountDevices();
      const activeDeviceAddress = get(this.sdk, 'state.accountDevice.device.address');
      return { ...accountData, devices, activeDeviceAddress };
    } catch (e) {
      this.handleError(e);
    }
    return null;
  }

  async transferAsset(transaction: AccountTransaction) {
    let estimateError;
    const {
      recipient,
      value,
      data,
      transactionSpeed = TransactionSpeeds[AVG],
      gasToken,
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

    const payForGasWithToken = !isEmpty(gasToken);

    return this.sdk.submitAccountTransaction(estimatedTransaction, payForGasWithToken);
  }

  createAccountPayment(recipient: string, token: ?string, value: BigNumber, paymentType?: string, reference?: string) {
    token = toChecksumAddress(token);
    return this.sdk.createAccountPayment(recipient, token, value.toHexString(), paymentType, reference);
  }

  getConnectedAccountTransaction(txHash: string) {
    return this.sdk.getConnectedAccountTransaction(txHash);
  }

  estimateTopUpAccountVirtualBalance(value: BigNumber, tokenAddress: ?string) {
    return this.sdk.estimateTopUpAccountVirtualBalance(value.toHexString(), toChecksumAddress(tokenAddress));
  }

  estimateWithdrawFromVirtualAccount(value: BigNumber, tokenAddress: ?string) {
    return this.sdk.estimateWithdrawFromAccountVirtualBalance(value.toHexString(), toChecksumAddress(tokenAddress));
  }

  estimatePaymentSettlement(hashes: string[] = []) {
    const items = hashes.length === 1 ? hashes[0] : hashes;
    return this.sdk.estimateWithdrawAccountPayment(items);
  }

  topUpAccountVirtualBalance(estimated: Object, payForGasWithToken: boolean = false) {
    return this.sdk.submitAccountTransaction(estimated, payForGasWithToken);
  }

  withdrawFromVirtualAccount(estimated: Object, payForGasWithToken: boolean = false) {
    return this.sdk.withdrawFromAccountVirtualBalance(estimated, payForGasWithToken);
  }

  withdrawAccountPayment(estimated: Object, payForGasWithToken: boolean = false) {
    return this.sdk.submitAccountTransaction(estimated, payForGasWithToken);
  }

  searchAccount(address: string) {
    return this.sdk.searchAccount({ address });
  }

  /**
   * SDK API call results are sorted descending by creation date
   * lastSyncedId is used to determine whether this page was already fetched
   */
  async getAccountPayments(lastSyncedId: ?number, page?: number = 0) {
    if (!this.sdkInitialized) return [];
    const data = await this.sdk.getConnectedAccountPayments(page).catch(this.handleError);
    if (!data) return [];

    const items = data.items || [];
    const foundLastSyncedTx = lastSyncedId
      ? items.find(({ id }) => id === lastSyncedId)
      : null;
    if (data.nextPage && !foundLastSyncedTx) {
      return [...items, ...(await this.getAccountPayments(lastSyncedId, page + 1))];
    }

    return items;
  }
  /**
   * SDK API call results are sorted descending by creation date
   * lastSyncedId is used to determine whether this page was already fetched
   */
  async getAccountTransactions(lastSyncedId: ?number, page?: number = 0) {
    if (!this.sdkInitialized) return [];
    // make sure getConnectedAccountTransactions passed hash is empty string
    const data = await this.sdk.getConnectedAccountTransactions('', page).catch(this.handleError);
    if (!data) return [];

    const items = data.items || [];
    const foundLastSyncedTx = lastSyncedId
      ? items.find(({ id }) => id === lastSyncedId)
      : null;
    if (data.nextPage && !foundLastSyncedTx) {
      return [...items, ...(await this.getAccountTransactions(lastSyncedId, page + 1))];
    }

    return items;
  }

  async getAccountPaymentsToSettle(accountAddress: string, page?: number = 0) {
    const filters = {
      state: PAYMENT_COMPLETED,
    };
    const data = await this.sdk.getConnectedAccountPayments(page, filters).catch(this.handleError);
    if (!data) return [];

    const items = (data.items || [])
      .filter(payment => {
        const recipientAddress = get(payment, 'recipient.account.address', '');
        return addressesEqual(recipientAddress, accountAddress);
      });

    if (data.nextPage) {
      return [...items, ...(await this.getAccountPaymentsToSettle(accountAddress, page + 1))];
    }

    return items;
  }

  async estimateAccountTransaction(
    transaction: AccountTransaction,
    assetData?: AssetData,
  ): Promise<EstimatedTransactionFee> {
    const { value: rawValue, transactionSpeed = TransactionSpeeds[AVG] } = transaction;
    let { data, recipient } = transaction;
    const decimals = get(assetData, 'decimals');
    const assetSymbol = get(assetData, 'token');
    const contractAddress = get(assetData, 'contractAddress');

    let value;

    // eth or token transfer
    if (assetSymbol === ETH) {
      value = ethToWei(rawValue);
    } else if (!data) {
      const tokenTransferValue = decimals > 0
        ? utils.parseUnits(rawValue.toString(), decimals)
        : EthersBigNumber.from(rawValue.toString());
      const transferMethod = ERC20_CONTRACT_ABI.find(item => item.name === 'transfer');
      data = abi.encodeMethod(transferMethod, [recipient, tokenTransferValue]);
      recipient = contractAddress;
      value = 0; // value is in encoded token transfer
    }

    const estimated = await this.sdk.estimateAccountTransaction(
      recipient,
      value,
      data,
      transactionSpeed,
    ).then(parseEstimatePayload).catch(() => ({}));

    return formatEstimated(estimated);
  }

  async estimateAccountDeviceDeployment(deviceAddress: string) {
    const estimated = await this.sdk.estimateAccountDeviceDeployment(deviceAddress)
      .then(parseEstimatePayload)
      .catch(() => ({}));

    return formatEstimated(estimated);
  }

  async estimateAccountDeviceUnDeployment(deviceAddress: string) {
    const estimated = await this.sdk.estimateAccountDeviceUnDeployment(deviceAddress)
      .then(parseEstimatePayload)
      .catch(() => ({}));

    return formatEstimated(estimated);
  }

  getTransactionStatus(hash: string) {
    if (!this.sdkInitialized) return null;
    return this.sdk.getConnectedAccountTransaction(hash)
      .then(({ state }) => state)
      .catch(() => null);
  }

  async setAccountEnsName(username: string) {
    if (!this.sdkInitialized) return null;

    const ensName = normalizeForEns(username);
    const estimated = await this.sdk
      .estimateSetAccountEnsName(ensName)
      .catch(e => this.reportError('Unable to estimate ENS update transaction', { e, username, ensName }));

    if (!estimated) return null;
    return this.sdk
      .setAccountEnsName(estimated)
      .catch(e => this.reportError('Unable to set ENS name for user', { e, username, ensName }));
  }

  switchToGasTokenRelayer() {
    return this.sdk.switchToGasTokenRelayer().catch(() => null);
  }

  addAccountDevice(address: string) {
    return this.sdk.createAccountDevice(address).catch(() => null);
  }

  removeAccountDevice(address: string) {
    return this.sdk.removeAccountDevice(address).catch(() => null);
  }

  handleError(error: any) {
    reportOrWarn('SmartWallet handleError: ', error, 'critical');
  }

  reportError(errorMessage: string, errorData: Object) {
    reportLog(errorMessage, errorData, Sentry.Severity.Error);
  }

  async reset() {
    if (!this.sdkInitialized) return;
    this.sdkInitialized = false;
    if (!this.sdk) return;
    this.sdk.event$.next(null); // unsubscribes
    subscribedToEvents = false;
    await this.sdk.reset({
      device: true,
      session: true,
    }).catch(null);
  }
}

const smartWalletInstance = new SmartWallet();
export default smartWalletInstance;
