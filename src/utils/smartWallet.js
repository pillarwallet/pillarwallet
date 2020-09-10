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
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';
import { sdkConstants, sdkInterfaces } from '@smartwallet/sdk';
import BigNumber from 'bignumber.js';
import * as Sentry from '@sentry/react-native';
import { BigNumber as EthersBigNumber, utils } from 'ethers';
import t from 'translations/translate';

// constants
import {
  SET_SMART_WALLET_ACCOUNT_ENS,
  SMART_WALLET_ACCOUNT_DEVICE_ADDED,
  SMART_WALLET_ACCOUNT_DEVICE_REMOVED,
  SMART_WALLET_DEPLOYMENT_ERRORS,
  SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
  SMART_WALLET_UPGRADE_STATUSES,
} from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import {
  TX_CONFIRMED_STATUS,
  TX_FAILED_STATUS,
  TX_PENDING_STATUS,
  TX_TIMEDOUT_STATUS,
} from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { ETH } from 'constants/assetsConstants';

// services
import smartWalletService, { parseEstimatePayload } from 'services/smartWallet';
import { getContract, buildERC20ApproveTransactionData } from 'services/assets';

// types
import type { Accounts } from 'models/Account';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type {
  TransactionFeeInfo,
  EstimatedTransactionFee,
  Transaction,
  TransactionExtra,
  GasToken,
} from 'models/Transaction';
import type { Asset } from 'models/Asset';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';
import type { EstimatePayload } from 'services/smartWallet';
import type { TranslatedString } from 'models/Translations';

import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// utils
import { getActiveAccount } from './accounts';
import { addressesEqual, getAssetDataByAddress, getAssetSymbolByAddress } from './assets';
import { isCaseInsensitiveMatch, reportLog } from './common';
import { buildHistoryTransaction, parseFeeWithGasToken } from './history';


type IAccountTransaction = sdkInterfaces.IAccountTransaction;
type IAccountDevice = sdkInterfaces.IAccountDevice;
const AccountTransactionTypes = { ...sdkConstants.AccountTransactionTypes };

const getMessage = (
  status: ?string,
  isSmartWalletActive: boolean,
): { title?: TranslatedString, message?: TranslatedString } => {
  switch (status) {
    case SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED:
      if (!isSmartWalletActive) return {};
      return {
        title: t('insight.smartWalletActivate.default.title'),
        message: t('insight.smartWalletActivate.default.description'),
      };
    case SMART_WALLET_UPGRADE_STATUSES.DEPLOYING:
      if (!isSmartWalletActive) return {};
      // TODO: get average time
      return {
        title: t('insight.smartWalletActivate.isBeingDeployed.title'),
        message: t('insight.smartWalletActivate.isBeingDeployed.description.waitingTime', { waitingTimeInMinutes: 4 }),
      };
    default:
      return {};
  }
};

export const userHasSmartWallet = (accounts: Accounts = []): boolean => {
  return accounts.some(acc => acc.type === ACCOUNT_TYPES.SMART_WALLET);
};

export const getSmartWalletStatus = (
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
): SmartWalletStatus => {
  const hasAccount = userHasSmartWallet(accounts);
  const activeAccount = getActiveAccount(accounts);
  const isSmartWalletActive = !!activeAccount && activeAccount.type === ACCOUNT_TYPES.SMART_WALLET;

  const { upgrade: { status } } = smartWalletState;
  const sendingBlockedMessage = getMessage(status, isSmartWalletActive);
  return {
    hasAccount,
    status,
    sendingBlockedMessage,
  };
};

export const isConnectedToSmartAccount = (connectedAccountRecord: ?Object) => !isEmpty(connectedAccountRecord);

export const getDeployErrorMessage = (errorType: string) => ({
  title: t('insight.smartWalletActivate.activationFailed.title'),
  message: errorType === SMART_WALLET_DEPLOYMENT_ERRORS.INSUFFICIENT_FUNDS
    ? t('insight.smartWalletActivate.activationFailed.error.needToSetupSmartAccount')
    : t('insight.smartWalletActivate.activationFailed.error.default'),
});

export const isSmartWalletDeviceDeployed = (
  device: ?$Shape<{ state: ?string, nextState: ?string }>,
): boolean => [get(device, 'state'), get(device, 'nextState')]
  .includes(sdkConstants.AccountDeviceStates.Deployed);

export const deviceHasGasTokenSupport = (device: IAccountDevice): boolean => {
  return !!get(device, 'features.gasTokenSupported');
};

export const accountHasGasTokenSupport = (account: Object): boolean => {
  if (isEmpty(get(account, 'devices', []))) return false;
  return account.devices.some(device => deviceHasGasTokenSupport(device) && isSmartWalletDeviceDeployed(device));
};

const extractAddress = details => get(details, 'account.address', '') || get(details, 'address', '');

export const getGasTokenDetails = (assets: Asset[], supportedAssets: Asset[], gasTokenAddress: string): ?GasToken => {
  const assetData = getAssetDataByAddress(assets, supportedAssets, gasTokenAddress);
  if (isEmpty(assetData)) return null;

  const { decimals, symbol, address } = assetData;
  return { decimals, symbol, address };
};

export const mapSdkToAppTxStatus = (sdkStatus: sdkConstants.AccountTransactionStates): string => {
  switch (sdkStatus) {
    case sdkConstants.AccountTransactionStates.Completed:
      return TX_CONFIRMED_STATUS;
    case sdkConstants.AccountTransactionStates.Failed:
      return TX_FAILED_STATUS;
    case sdkConstants.AccountTransactionStates.DroppedOrReplaced:
      return TX_TIMEDOUT_STATUS;
    default:
      return TX_PENDING_STATUS;
  }
};

export const parseSmartWalletTransactions = (
  smartWalletTransactions: IAccountTransaction[],
  supportedAssets: Asset[],
  assets: Asset[],
  relayerExtensionAddress: ?string,
): Transaction[] => smartWalletTransactions
  .reduce((mapped, smartWalletTransaction) => {
    const {
      hash,
      from: fromDetails,
      to: toDetails,
      updatedAt, // SDK does not provide createdAt, only updatedAt
      state,
      tokenRecipient,
      tokenAddress,
      value: rawValue,
      transactionType,
      paymentHash,
      tokenValue,
      index,
      gas: {
        used: gasUsed,
        price: gasPrice,
      },
      gasToken: gasTokenAddress,
      fee: transactionFee,
    } = smartWalletTransaction;

    // NOTE: same transaction could have multiple records, those are different by index
    // we always leave only one record with the biggest index number
    const sameHashTransactions = smartWalletTransactions.filter(tx => isCaseInsensitiveMatch(tx.hash, hash));
    if (sameHashTransactions.length > 1) { // don't count current transaction
      const maxIndex = Math.max(...sameHashTransactions.map(tx => tx.index));
      if (index < maxIndex) {
        // don't store transactions with lover index
        return mapped;
      }
    }

    const from = extractAddress(fromDetails);

    let to = extractAddress(toDetails);
    if (transactionType === AccountTransactionTypes.Erc20Transfer) {
      to = tokenRecipient || '';
    }

    // ignore some transaction types
    if (transactionType === AccountTransactionTypes.TopUpErc20Approve) return mapped;

    const status = mapSdkToAppTxStatus(state);
    let value = tokenAddress ? tokenValue : rawValue;
    value = new BigNumber(value.toString());

    let transaction = {
      from: from || '',
      to: to || '',
      hash,
      value,
      createdAt: +new Date(updatedAt) / 1000,
      asset: ETH,
      status,
      gasPrice: gasPrice.toNumber(),
      gasLimit: gasUsed.toNumber(),
    };

    if (tokenAddress) {
      const symbol = getAssetSymbolByAddress(assets, supportedAssets, tokenAddress);
      if (symbol) {
        transaction.asset = symbol;
      } else {
        return mapped; // skip non-supported assets
      }
    }

    if (transactionType === AccountTransactionTypes.Settlement) {
      // get and process all transactions with the same hash
      const extra = sameHashTransactions.map(tx => {
        const txAsset = getAssetSymbolByAddress(assets, supportedAssets, tx.tokenAddress) || ETH;
        const txValue = tx.tokenValue.toString();
        return {
          symbol: txAsset,
          value: txValue,
          hash: tx.paymentHash,
        };
      });

      transaction = {
        ...transaction,
        value: '0',
        tag: PAYMENT_NETWORK_TX_SETTLEMENT,
        asset: PAYMENT_NETWORK_TX_SETTLEMENT,
        extra,
      };
    } else if (transactionType === AccountTransactionTypes.Withdrawal) {
      transaction = {
        ...transaction,
        tag: PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
        extra: {
          paymentHash,
        },
      };
    } else if (transactionType === AccountTransactionTypes.TopUp) {
      transaction = {
        ...transaction,
        tag: PAYMENT_NETWORK_ACCOUNT_TOPUP,
      };
    } else if (transactionType === AccountTransactionTypes.AccountDeployment) {
      transaction = {
        ...transaction,
        tag: PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
      };
    } else if (transactionType === AccountTransactionTypes.UpdateAccountEnsName) {
      transaction = {
        ...transaction,
        tag: SET_SMART_WALLET_ACCOUNT_ENS,
        extra: {
          ensName: get(fromDetails, 'account.ensName'),
        },
      };
    } else if (transactionType === AccountTransactionTypes.AddDevice) {
      const addedDeviceAddress = get(smartWalletTransaction, 'extra.address');
      if (!isEmpty(addedDeviceAddress)) {
        const tag = addressesEqual(addedDeviceAddress, relayerExtensionAddress)
          ? SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER
          : SMART_WALLET_ACCOUNT_DEVICE_ADDED;
        transaction = { ...transaction, tag };
      }
    } else if (transactionType === AccountTransactionTypes.RemoveDevice) {
      transaction = {
        ...transaction,
        tag: SMART_WALLET_ACCOUNT_DEVICE_REMOVED,
      };
    }

    if (!isEmpty(gasTokenAddress) && transactionFee) {
      // TODO: this should be returned from the backend
      const gasToken = getGasTokenDetails(assets, supportedAssets, gasTokenAddress);
      if (!isEmpty(gasToken)) {
        const feeWithGasToken = parseFeeWithGasToken(gasToken, transactionFee);
        transaction = { ...transaction, feeWithGasToken };
      }
    }

    const mappedTransaction = buildHistoryTransaction(transaction);
    mapped.push(mappedTransaction);

    return mapped;
  }, []);

export const transactionExtraContainsPaymentHash = (paymentHash: string, extra: TransactionExtra): boolean => {
  if (isEmpty(extra)) return false;
  // extra can be either object or array
  // $FlowFixMe
  return (!Array.isArray(extra) && isCaseInsensitiveMatch(extra.paymentHash, paymentHash))
    || (Array.isArray(extra) && extra.some(({ hash }) => isCaseInsensitiveMatch(hash, paymentHash)));
};

// hiding unsettled transactions that were just settled and are pending
// hiding withdraw payment transaction if withdraw is pending
export const isHiddenUnsettledTransaction = (
  paymentHash: string,
  history: Object[],
): boolean => history
  .filter(({ status }) => status === TX_PENDING_STATUS)
  .some(({ tag, extra }: { tag: string, extra: TransactionExtra }) =>
    [PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL, PAYMENT_NETWORK_TX_SETTLEMENT].includes(tag)
      && transactionExtraContainsPaymentHash(paymentHash, extra),
  );

export const isDeployingSmartWallet = (smartWalletState: SmartWalletReducerState, accounts: Accounts) => {
  const { upgrade: { deploymentStarted, deploymentData: { error } } } = smartWalletState;
  const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
  return !error && (deploymentStarted || smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYING);
};

export const getDeploymentData = (smartWalletState: SmartWalletReducerState) => {
  return get(smartWalletState, 'upgrade.deploymentData', {});
};

export const getDeploymentHash = (smartWalletState: SmartWalletReducerState) => {
  return get(smartWalletState, 'upgrade.deploymentData.hash', '');
};

export const buildSmartWalletTransactionEstimate = (apiEstimate: EstimatePayload) => {
  const {
    gasAmount,
    gasPrice,
    totalCost,
    gasTokenCost,
    gasToken,
  } = parseEstimatePayload(apiEstimate);

  let estimate = {
    gasAmount,
    gasPrice,
    totalCost,
  };

  // check if fee by gas token available
  const hasGasTokenSupport = get(apiEstimate, 'relayerFeatures.gasTokenSupported', false);
  if (!hasGasTokenSupport) return estimate;

  const parsedGasTokenCost = new BigNumber(gasTokenCost ? gasTokenCost.toString() : 0);

  if (gasTokenCost && gasTokenCost.gt(0)) {
    estimate = {
      ...estimate,
      gasToken,
      gasTokenCost: parsedGasTokenCost,
    };
  }

  return estimate;
};

export const buildTxFeeInfo = (estimated: ?EstimatedTransactionFee, useGasToken: boolean): TransactionFeeInfo => {
  if (!estimated) return { fee: null };

  const { gasTokenCost, gasToken, ethCost } = estimated;

  if (!useGasToken || !gasToken) {
    return { fee: ethCost };
  }

  return {
    fee: gasTokenCost,
    gasToken,
  };
};


export const getSmartWalletTxFee = async (transaction: Object, useGasToken: boolean): Promise<Object> => {
  const defaultResponse = { fee: new BigNumber('0'), error: true };
  const estimateTransaction = {
    data: transaction.data,
    recipient: transaction.to,
    value: transaction.amount,
  };

  const estimated = await smartWalletService
    .estimateAccountTransaction(estimateTransaction)
    .then(result => buildTxFeeInfo(result, useGasToken))
    .catch((e) => {
      reportLog('Error getting fee for transaction', {
        ...transaction,
        message: e.message,
      }, Sentry.Severity.Error);
      return null;
    });

  if (!estimated) {
    return defaultResponse;
  }

  return estimated;
};

export const getTxFeeAndTransactionPayload = async (
  _transactionPayload: Object, useGasToken: boolean,
): Promise<Object> => {
  const { fee: txFeeInWei, gasToken, error } = await getSmartWalletTxFee(_transactionPayload, useGasToken);
  let transactionPayload = _transactionPayload;
  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  if (error) {
    return null;
  }

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
};

export const checkAllowance = async (sender: string, tokenAddress: string, allowedAddress: string) => {
  const erc20Contract = getContract(tokenAddress, ERC20_CONTRACT_ABI);
  const approvedAmountBN = erc20Contract
    ? await erc20Contract.allowance(sender, allowedAddress)
    : EthersBigNumber.from(0);
  return approvedAmountBN;
};

export const addAllowanceTransaction = async (
  transaction: Object, sender: string, allowedAddress: string, token: Asset, tokenAmount: EthersBigNumber,
): Promise<Object> => {
  const approvedAmountBN = await checkAllowance(sender, token.address, allowedAddress);

  if (!approvedAmountBN || tokenAmount.gt(approvedAmountBN)) {
    const rawValue = 1000000000;
    const valueToApprove = utils.parseUnits(rawValue.toString(), token.decimals);
    const approveTransactionData = buildERC20ApproveTransactionData(allowedAddress, valueToApprove, token.decimals);

    return {
      from: sender,
      to: token.address,
      data: approveTransactionData,
      amount: 0,
      symbol: ETH,
      sequentialSmartWalletTransactions: [transaction],
    };
  }
  return transaction;
};
