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
import { toChecksumAddress } from '@netgum/utils';
import { BigNumber } from 'bignumber.js';
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

import { getEnv } from 'configs/envConfig';

// constants
import { ARCHANOVA_WALLET_DEPLOYMENT_ERRORS } from 'constants/archanovaConstants';

// utils
import { addressesEqual } from 'utils/assets';
import { printLog, reportErrorLog, reportLog, reportOrWarn } from 'utils/common';
import { mapToEthereumTransactions } from 'utils/transactions';

// types
import type {
  ConnectedArchanovaWalletAccount,
  ArchanovaWalletAccount,
  ArchanovaAccountDevice,
} from 'models/ArchanovaWalletAccount';
import type { EthereumTransaction, GasToken, TransactionPayload } from 'models/Transaction';


const PAYMENT_COMPLETED = get(sdkConstants, 'AccountPaymentStates.Completed', '');

export type ArchanovaEstimatePayload = {
  gasFee: BigNumber,
  signedGasPrice: {
    gasPrice: BigNumber,
  },
  signedGasTokenCost?: sdkInterfaces.ISignedGasTokenCost;
  gasToken: sdkInterfaces.IGasToken;
  relayerVersion: number;
  relayerFeatures: sdkInterfaces.RelayerFeatures;
};

export type ArchanovaTransactionEstimate = {
  ethCost: BigNumber,
  gasTokenCost?: ?BigNumber,
  gasToken?: ?GasToken,
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

export const parseEstimatePayload = (estimatePayload: ArchanovaEstimatePayload): ParsedEstimate => {
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

export const formatEstimated = (estimated: ?ParsedEstimate) => {
  // for some invalid inputs, tx fee estimation will return undefined
  // screens don't handle errors ATM, so we default to 0 to prevent app crashes
  if (!estimated) {
    return {
      ethCost: new BigNumber(0),
      gasTokenCost: new BigNumber(0),
      gasToken: new BigNumber(0),
    };
  }
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

const parseEstimateError = (error: Error, logExtras: Object = {}) => {
  let errorMessage = t('error.unableToEstimateTransaction');
  const errorReplaceString = '[ethjs-query] while formatting outputs from RPC'; // eslint-disable-line
  if (error?.message) {
    /**
     * the return result from Archanova is problematic,
     * it contains "ethjs-query" part and rest of message is JSON string
     * this is known issue on Archanova end, but it's not planned to be fixed
     * return example:
     * [ethjs-query] while formatting outputs from RPC
     * '{"value":{"body":"{\"oneMore\":\"escaped\",\"JSON\":\"object\"}"}}'
     */
    if (error.message.includes(errorReplaceString)) {
      try {
        const messageJsonPart1 = JSON.parse(error.message.replace(errorReplaceString, '').trim().slice(1, -1));
        const messageJsonPart2 = JSON.parse(messageJsonPart1?.value?.body);
        const estimateError = messageJsonPart2?.error;
        if (estimateError?.message) errorMessage = estimateError.message;

        // if it starts with 0x then we shouldn't show (can occur)
        if (estimateError?.data && !estimateError.data.startsWith('0x')) {
          errorMessage = `${estimateError.data}: ${errorMessage}`;
        }
      } catch (parseError) {
        // unable to decrypt json
        reportLog('Smart Wallet service error message json parser failed', {
          parseError,
          error,
          ...logExtras,
        });
      }
    } else {
      // this means it's more generic error message and not "ethjs-query"
      errorMessage = error.message;
    }
  }

  reportErrorLog('Smart Wallet service estimateAccountTransaction failed', {
    errorMessage,
    ...logExtras,
  });

  throw new Error(errorMessage);
};

export class ArchanovaService {
  sdk: Sdk = null;
  sdkInitialized: boolean;

  constructor() {
    this.sdk = null;
    this.sdkInitialized = false;
  }

  getSdk() {
    if (!this.sdk) {
      const environmentNetwork = this.getEnvironmentNetwork(getEnv().NETWORK_PROVIDER);
      const sdkOptions = getSdkEnvironment(environmentNetwork);
      try {
        this.sdk = createSdk(sdkOptions);
      } catch (err) {
        this.handleError(err);
      }
    }

    return this.sdk;
  }

  getEnvironmentNetwork(networkName: string) {
    switch (networkName) {
      case 'rinkeby': return SdkEnvironmentNames.Rinkeby;
      case 'kovan': return SdkEnvironmentNames.Kovan;
      case 'homestead': return SdkEnvironmentNames.Main;
      default: return SdkEnvironmentNames.Kovan;
    }
  }

  async init(privateKey: string, onEvent?: Function, forceInit: boolean = false) {
    if (this.sdkInitialized && !forceInit) return;

    await this.getSdk()
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
    this.getSdk().event$.subscribe(event => {
      if (onEvent) onEvent(event);
    });
    subscribedToEvents = true;
  }

  async getAccounts(): Promise<ArchanovaWalletAccount[]> {
    const accounts = await this.getSdk().getConnectedAccounts()
      .then(({ items = [] }) => items)
      .catch(() => []);

    if (!accounts) {
      return [];
    }

    return accounts;
  }

  createAccount() {
    return this.getSdk()
      .createAccount()
      .catch((e) => {
        reportErrorLog('Unable to create Smart Account', { e });
        return null;
      });
  }

  getConnectedAccountDevices() {
    return this.getSdk().getConnectedAccountDevices()
      .then((result) => get(result, 'items', []))
      .catch(this.handleError);
  }

  getConnectedAccountDevice(deviceAddress: string): Promise<?ArchanovaAccountDevice> {
    return this.getSdk().getConnectedAccountDevice(deviceAddress).catch(this.handleError);
  }

  async connectAccount(address: string) {
    if (!this.getConnectedAccountFromSdkState()) {
      await this.getSdk().connectAccount(address).catch(this.handleError);
    }

    return this.fetchConnectedAccount();
  }

  getConnectedAccountFromSdkState() {
    return this.getSdk()?.state?.account;
  }

  async deployAccount(
    estimate?: sdkInterfaces.IEstimatedAccountDeployment,
  ): Promise<{ error?: string, deployTxHash?: string }> {
    const deployEstimate = estimate || await this.estimateAccountDeployment().catch(this.handleError);
    if (!deployEstimate) return { error: ARCHANOVA_WALLET_DEPLOYMENT_ERRORS.REVERTED };

    return this.getSdk().deployAccount(deployEstimate, false)
      .then((hash) => ({ deployTxHash: hash }))
      .catch((e) => {
        reportErrorLog('Unable to deploy account', { e });
        return { error: e.message };
      });
  }

  async deployAccountDevice(deviceAddress: string, payForGasWithToken: boolean = false): Promise<?string> {
    const deployEstimate = await this.getSdk().estimateAccountDeviceDeployment(deviceAddress).catch(this.handleError);
    if (!deployEstimate) return null;

    return this.getSdk().submitAccountTransaction(deployEstimate, payForGasWithToken)
      .catch((e) => {
        reportErrorLog('Unable to deploy device', { e });
        return null;
      });
  }

  async unDeployAccountDevice(deviceAddress: string, payForGasWithToken: boolean = false) {
    const unDeployEstimate =
      await this.getSdk().estimateAccountDeviceUnDeployment(deviceAddress).catch(this.handleError);
    return this.getSdk().submitAccountTransaction(unDeployEstimate, payForGasWithToken)
      .catch((e) => {
        reportErrorLog('Unable to undeploy device', { e });
        return null;
      });
  }

  getAccountStakedAmount(tokenAddress: ?string): Promise<BigNumber> | BigNumber {
    if (!tokenAddress) return new BigNumber(0);
    return this.getSdk().getConnectedAccountVirtualBalance(tokenAddress)
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
    return this.getSdk().getConnectedAccountVirtualPendingBalances()
      .catch((e) => {
        this.handleError(e);
        return [];
      });
  }

  async fetchConnectedAccount(): Promise<ConnectedArchanovaWalletAccount> {
    try {
      const { state: { account: accountData } } = this.getSdk();
      const devices = await this.getConnectedAccountDevices();
      const activeDeviceAddress = get(this.getSdk(), 'state.accountDevice.device.address');
      return { ...accountData, devices, activeDeviceAddress };
    } catch (e) {
      this.handleError(e);
    }
    return null;
  }

  async createAccountPayment(
    recipient: string,
    token: ?string,
    value: EthersBigNumber,
    paymentType?: string,
    reference?: string,
  ) {
    token = toChecksumAddress(token);

    const { hash } = await this.getSdk().createAccountPayment(
      recipient,
      token,
      value.toHexString(),
      paymentType,
      reference,
    );

    return { hash };
  }

  async sendTransaction(
    transaction: TransactionPayload,
    fromAccountAddress: string,
    usePPN?: boolean,
  ) {
    if (usePPN) {
      const {
        amount,
        decimals,
        to,
        contractAddress,
      } = transaction;
      const value = utils.parseUnits(amount.toString(), decimals);

      return this.createAccountPayment(to, contractAddress, value);
    }

    const { gasToken } = transaction;
    const payForGasWithToken = !isEmpty(gasToken);

    const transactions = await mapToEthereumTransactions(transaction, fromAccountAddress);

    let estimateMethodParams = [];

    // append params for multiple sequential transactions (ref – estimateAccountTransaction method params)
    transactions.forEach(({ to, value, data }) => {
      estimateMethodParams = [...estimateMethodParams, to, value.toHexString(), data];
    });

    const estimatedTransaction = await this.getSdk().estimateAccountTransaction(...estimateMethodParams);

    const hash = await this.getSdk().submitAccountTransaction(estimatedTransaction, payForGasWithToken);

    return { hash };
  }

  async sendRawTransactions(rawTransactions: string[]): Promise<?string> {
    const estimated = await this.getSdk().estimateAccountRawTransactions(rawTransactions);
    return this.getSdk().submitAccountTransaction(estimated);
  }

  getConnectedAccountTransaction(txHash: string) {
    return this.getSdk().getConnectedAccountTransaction(txHash);
  }

  estimateTopUpAccountVirtualBalance(value: EthersBigNumber, tokenAddress: ?string) {
    return this.getSdk().estimateTopUpAccountVirtualBalance(value.toHexString(), toChecksumAddress(tokenAddress));
  }

  estimateWithdrawFromVirtualAccount(value: EthersBigNumber, tokenAddress: ?string) {
    return this.getSdk()
      .estimateWithdrawFromAccountVirtualBalance(value.toHexString(), toChecksumAddress(tokenAddress));
  }

  estimatePaymentSettlement(hashes: string[] = []) {
    const items = hashes.length === 1 ? hashes[0] : hashes;
    return this.getSdk().estimateWithdrawAccountPayment(items);
  }

  topUpAccountVirtualBalance(estimated: Object, payForGasWithToken: boolean = false) {
    return this.getSdk().submitAccountTransaction(estimated, payForGasWithToken);
  }

  withdrawFromVirtualAccount(estimated: Object, payForGasWithToken: boolean = false) {
    return this.getSdk().withdrawFromAccountVirtualBalance(estimated, payForGasWithToken);
  }

  withdrawAccountPayment(estimated: Object, payForGasWithToken: boolean = false) {
    return this.getSdk().accountTransaction.submitAccountProxyTransaction(estimated, payForGasWithToken);
  }

  searchAccount(address: string) {
    return this.getSdk().searchAccount({ address });
  }

  /**
   * SDK API call results are sorted descending by creation date
   * lastSyncedId is used to determine whether this page was already fetched
   */
  async getAccountPayments(lastSyncedId: ?number, page?: number = 0) {
    if (!this.sdkInitialized) return [];
    const data = await this.getSdk().getConnectedAccountPayments(page).catch(this.handleError);
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
    const data = await this.getSdk().getConnectedAccountTransactions('', page).catch(this.handleError);
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
    const data = await this.getSdk().getConnectedAccountPayments(page, filters).catch(this.handleError);
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

  async estimateAccountTransactions(transactions: EthereumTransaction[]): Promise<?ArchanovaTransactionEstimate> {
    let estimateMethodParams = [];

    // append params for multiple sequential transactions (ref – estimateAccountTransaction method params)
    transactions.forEach(({ to, value, data }) => {
      estimateMethodParams = [...estimateMethodParams, to, value.toHexString(), data];
    });

    estimateMethodParams = [...estimateMethodParams];

    const estimated = await this.getSdk()
      .estimateAccountTransaction(...estimateMethodParams)
      .then(parseEstimatePayload)
      .catch((error) => parseEstimateError(error, { transactions }));

    // $FlowFixMe: bignumber.js typing
    return formatEstimated(estimated);
  }

  // required by ENS migrator
  async estimateAccountRawTransactions(rawTransactions: string[]): Promise<?ArchanovaTransactionEstimate> {
    const estimated = await this.getSdk()
      .estimateAccountRawTransactions(rawTransactions)
      .then(parseEstimatePayload)
      .catch((error) => parseEstimateError(error, { rawTransactions }));

    // $FlowFixMe: bignumber.js typing
    return formatEstimated(estimated);
  }

  async estimateAccountDeviceDeployment(deviceAddress: string) {
    const estimated = await this.getSdk().estimateAccountDeviceDeployment(deviceAddress)
      .then(parseEstimatePayload)
      .catch(() => ({}));

    return formatEstimated(estimated);
  }

  async estimateAccountDeviceUnDeployment(deviceAddress: string) {
    const estimated = await this.getSdk().estimateAccountDeviceUnDeployment(deviceAddress)
      .then(parseEstimatePayload)
      .catch(() => ({}));

    return formatEstimated(estimated);
  }

  estimateAccountDeployment() {
    return this.getSdk().estimateAccountDeployment();
  }

  getTransactionInfo(hash: string) {
    if (!this.sdkInitialized) return null;
    return this.getSdk().getConnectedAccountTransaction(hash).catch(() => null);
  }

  switchToGasTokenRelayer() {
    return this.getSdk().switchToGasTokenRelayer().catch(() => null);
  }

  addAccountDevice(address: string) {
    return this.getSdk().createAccountDevice(address).catch(() => null);
  }

  removeAccountDevice(address: string) {
    return this.getSdk().removeAccountDevice(address).catch(() => null);
  }

  getConnectedAccountTransactionExplorerLink(hash: string): string {
    return this.getSdk().getConnectedAccountTransactionExplorerLink(hash); // not a promise
  }

  isValidSession(): Promise<string> {
    return this.getSdk().session.verifyToken().catch(() => false);
  }

  handleError(error: any) {
    reportOrWarn('Archanova handleError: ', error, 'critical');
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
    }).catch(() => null);
  }
}

const archanovaInstance = new ArchanovaService();
export default archanovaInstance;
