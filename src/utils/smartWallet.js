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

// constants
import {
  SET_SMART_WALLET_ACCOUNT_ENS,
  SMART_WALLET_DEPLOYMENT_ERRORS,
  SMART_WALLET_UPGRADE_STATUSES,
} from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { ETH } from 'constants/assetsConstants';

// types
import type { Accounts } from 'models/Account';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Transaction, TransactionExtra } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';

// local utils
import { findKeyBasedAccount, getActiveAccount, findFirstSmartAccount } from './accounts';
import { getAssetDataByAddress, getAssetSymbolByAddress } from './assets';
import { isCaseInsensitiveMatch } from './common';
import { buildHistoryTransaction, parseFeeWithGasToken } from './history';


type IAccountTransaction = sdkInterfaces.IAccountTransaction;
const AccountTransactionTypes = { ...sdkConstants.AccountTransactionTypes };

const getMessage = (
  status: ?string,
  isSmartWalletActive: boolean,
  smartWalletState: SmartWalletReducerState,
) => {
  switch (status) {
    case SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED:
      if (!isSmartWalletActive) return {};
      return {
        title: 'To send assets, activate Smart Wallet first',
        message: 'You will have to pay a small fee',
      };
    case SMART_WALLET_UPGRADE_STATUSES.DEPLOYING:
      if (!isSmartWalletActive) return {};
      // TODO: get average time
      return {
        title: 'Smart Wallet is being deployed now',
        message: 'You will be able to send assets once it\'s deployed.' +
          '\nCurrent average waiting time is 4 mins',
      };
    case SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS:
      const { upgrade: { transfer: { transactions } } } = smartWalletState;
      const total = transactions.length;
      const complete = transactions.filter(tx => tx.status === TX_CONFIRMED_STATUS).length;
      return {
        title: 'Assets are being transferred to Smart Wallet',
        message: 'You will be able to send assets once submitted transfer is complete' +
          `${isSmartWalletActive ? ' and Smart Wallet is deployed' : ''}.` +
          `\nCurrently ${complete} of ${total} assets are transferred.`,
      };
    default:
      return {};
  }
};

export const userHasSmartWallet = (accounts: Accounts = []): boolean => {
  return accounts.some(acc => acc.type === ACCOUNT_TYPES.SMART_WALLET);
};

export const getPreferredWalletId = (accounts: Accounts = []): string => {
  const smartWallet = findFirstSmartAccount(accounts);
  if (smartWallet) {
    return smartWallet.walletId;
  }
  const legacyWallet = findKeyBasedAccount(accounts);
  return legacyWallet ? legacyWallet.walletId : '';
};

export const getSmartWalletStatus = (
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
): SmartWalletStatus => {
  const hasAccount = userHasSmartWallet(accounts);
  const activeAccount = getActiveAccount(accounts);
  const isSmartWalletActive = !!activeAccount && activeAccount.type === ACCOUNT_TYPES.SMART_WALLET;

  const { upgrade: { status } } = smartWalletState;
  const sendingBlockedMessage = getMessage(status, isSmartWalletActive, smartWalletState);
  return {
    hasAccount,
    status,
    sendingBlockedMessage,
  };
};

export const isConnectedToSmartAccount = (connectedAccountRecord: ?Object) => !isEmpty(connectedAccountRecord);

export const getDeployErrorMessage = (errorType: string) => ({
  title: 'Smart Wallet activation failed',
  message: errorType === SMART_WALLET_DEPLOYMENT_ERRORS.INSUFFICIENT_FUNDS
    ? 'You need to top up your Smart Account first'
    : 'There was an error on our server. Please try to re-activate the account by clicking the button bellow',
});

const extractAddress = details => get(details, 'account.address', '') || get(details, 'address', '');

export const parseSmartWalletTransactions = (
  smartWalletTransactions: IAccountTransaction[],
  supportedAssets: Asset[],
  assets: Asset[],
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

    const TRANSACTION_COMPLETED = get(sdkConstants, 'AccountTransactionStates.Completed', '');
    // TODO: add support for failed transactions
    const status = state === TRANSACTION_COMPLETED ? TX_CONFIRMED_STATUS : TX_PENDING_STATUS;

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
    }

    if (!isEmpty(gasTokenAddress)) {
      const gasToken = getAssetDataByAddress(assets, supportedAssets, gasTokenAddress);
      if (!isEmpty(gasToken)) {
        const { decimals: gasTokenDecimals, symbol: gasTokenSymbol } = gasToken;
        transaction.feeWithGasToken = parseFeeWithGasToken({
          decimals: gasTokenDecimals,
          symbol: gasTokenSymbol,
          address: gasTokenAddress,
        }, transactionFee);
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
