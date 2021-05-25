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

import type SDKWrapper from 'services/api';

// constants
import {
  TRANSACTION_CONFIRMATION_EVENT,
  TRANSACTION_CONFIRMATION_SENDER_EVENT,
  TRANSACTION_PENDING_EVENT,
  TX_CONFIRMED_STATUS,
  TX_FAILED_STATUS,
  TX_PENDING_STATUS,
  TRANSACTION_EVENT,
} from 'constants/historyConstants';
import { PAYMENT_NETWORK_TX_SETTLEMENT, PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT } from 'constants/paymentNetworkConstants';

// types
import type {
  FeeWithGasToken,
  GasToken,
  Transaction,
  TransactionEthers,
  TransactionsStore,
} from 'models/Transaction';
import type { Account } from 'models/Account';
import type { Value } from 'utils/common';

// utils
import { mapTransactionsHistory } from 'utils/feedData';
import { isCaseInsensitiveMatch, wrapBigNumber } from 'utils/common';

export const buildHistoryTransaction = ({
  from,
  hash,
  batchHash,
  to,
  value,
  gasPrice,
  gasLimit,
  asset,
  note,
  status,
  createdAt,
  isPPNTransaction,
  tag,
  extra,
  stateInPPN,
  feeWithGasToken,
  type,
}: TransactionEthers): Transaction => ({
  status: status || TX_PENDING_STATUS,
  gasUsed: gasLimit ? Number(gasLimit) : 0,
  gasPrice: gasPrice ? Number(gasPrice) : 0,
  value: typeof value === 'object' ? value.toString() : value,
  from,
  hash,
  batchHash,
  to,
  // $FlowFixMe: either will be present for _id
  _id: hash || batchHash,
  asset,
  createdAt: createdAt || Math.round(+new Date() / 1000), // seconds
  nbConfirmations: 0,
  note,
  isPPNTransaction: !!isPPNTransaction,
  tag,
  extra,
  stateInPPN,
  feeWithGasToken,
  type,
});

export const isTransactionEvent = (eventType: string) => {
  return [
    TRANSACTION_PENDING_EVENT,
    TRANSACTION_CONFIRMATION_EVENT,
    TRANSACTION_CONFIRMATION_SENDER_EVENT,
  ].includes(eventType);
};

export const updateAccountHistory = (
  history: TransactionsStore,
  accountId: string,
  accountHistory: Transaction[] = [],
) => {
  return {
    ...history,
    [accountId]: accountHistory,
  };
};

type UpdateHistoryRecordResult = {
  updatedHistory: TransactionsStore,
  txUpdated: ?Transaction,
};

export function updateHistoryRecord(
  allHistory: TransactionsStore,
  hashToUpdate: string,
  modifier: Function,
): UpdateHistoryRecordResult {
  hashToUpdate = hashToUpdate.toLowerCase();

  let txUpdated = null;
  const accounts = Object.keys(allHistory);
  const updatedHistory = accounts.reduce((history, accountId) => {
    const accountHistory = allHistory[accountId].map(transaction => {
      if (!isCaseInsensitiveMatch(transaction.hash, hashToUpdate)) {
        return transaction;
      }
      txUpdated = modifier(transaction);
      return txUpdated;
    });
    return { ...history, [accountId]: accountHistory };
  }, {});

  return {
    updatedHistory,
    txUpdated,
  };
}

export const parseFeeWithGasToken = (
  gasToken: ?GasToken,
  fee: ?Value,
): FeeWithGasToken | null => {
  if (!gasToken || isEmpty(gasToken) || !fee) return null;
  return { feeInWei: wrapBigNumber(fee), gasToken };
};

export const findTransactionAcrossAccounts = (
  history: TransactionsStore,
  hash: ?string,
  batchHash: ?string,
): ?Transaction => {
  if (!hash && !batchHash) return {};

  return Object.keys(history)
    .flatMap((accountId) => history[accountId])
    .find((transaction) => isCaseInsensitiveMatch(hash ?? '', transaction?.hash)
      || isCaseInsensitiveMatch(batchHash ?? '', transaction?.batchHash));
};

export const getTrxInfo = async (api: SDKWrapper, hash: string, network?: string) => {
  const [txInfo, txReceipt] = await Promise.all([
    api.fetchTxInfo(hash, network),
    api.fetchTransactionReceipt(hash, network),
  ]);

  if (!txInfo || !txReceipt) return null;

  const status = txReceipt.status ? TX_CONFIRMED_STATUS : TX_FAILED_STATUS;

  return {
    txInfo,
    txReceipt,
    status,
  };
};

export const getTransactionsFromHistory = (history: Transaction[], accounts: Account[]) => {
  const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
  return mapTransactionsHistory(tokenTxHistory, accounts, TRANSACTION_EVENT);
};

export const getTokenTransactionsFromHistory = (
  history: Transaction[],
  accounts: Account[],
  token: string,
): Transaction[] => {
  const mappedTransactions = getTransactionsFromHistory(history, accounts);
  return mappedTransactions.filter(
    ({ asset, tag = '', extra = [] }) =>
      (asset === token && tag !== PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT) ||
      (tag === PAYMENT_NETWORK_TX_SETTLEMENT && extra.find(({ symbol }) => symbol === token)),
  );
};
