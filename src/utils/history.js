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
import { isEmpty, mapValues } from 'lodash';

// constants
import {
  TRANSACTION_CONFIRMATION_EVENT,
  TRANSACTION_CONFIRMATION_SENDER_EVENT,
  TRANSACTION_PENDING_EVENT,
  TX_PENDING_STATUS,
} from 'constants/historyConstants';

// types
import type { FeeWithGasToken, GasToken, Transaction, TransactionEthers } from 'models/Transaction';
import type { Value, TokenValue } from 'models/Value';
import type { TransactionsStore } from 'models/History';
import type { Chain } from 'models/Chain';
import type { CollectiblesHistoryStore } from 'models/Collectible';

// utils
import { formatUnits, isCaseInsensitiveMatch } from 'utils/common';
import { wrapBigNumber } from 'utils/bigNumber';
import { nativeAssetPerChain } from 'utils/chains';

export const buildHistoryTransaction = ({
  from,
  hash,
  batchHash,
  to,
  value,
  gasPrice,
  gasUsed,
  assetSymbol,
  assetAddress,
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
  gasUsed: gasUsed ? Number(gasUsed) : 0,
  gasPrice: gasPrice ? Number(gasPrice) : 0,
  value: typeof value === 'object' ? value.toString() : value,
  from,
  hash,
  batchHash,
  to,
  // $FlowFixMe: either will be present for _id
  _id: hash || batchHash,
  assetSymbol,
  assetAddress,
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
  return [TRANSACTION_PENDING_EVENT, TRANSACTION_CONFIRMATION_EVENT, TRANSACTION_CONFIRMATION_SENDER_EVENT].includes(
    eventType,
  );
};

export const updateAccountHistoryForChain = (
  history: TransactionsStore,
  accountId: string,
  chain: string,
  transactions: Transaction[],
): TransactionsStore => ({
  ...history,
  [accountId]: {
    ...(history[accountId] ?? {}),
    [chain]: transactions,
  },
});

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
    const accountHistory = mapValues(allHistory[accountId], (transactions = [], chain) =>
      transactions.map((transaction) => {
        if (!isCaseInsensitiveMatch(transaction.hash, hashToUpdate)) {
          return transaction;
        }

        txUpdated = modifier(transaction, chain);

        return txUpdated;
      }),
    );

    return { ...history, [accountId]: accountHistory };
  }, {});

  return {
    updatedHistory,
    txUpdated,
  };
}

export const parseFeeWithGasToken = (gasToken: ?GasToken, fee: ?Value): FeeWithGasToken | null => {
  if (!gasToken || isEmpty(gasToken) || !fee) return null;
  return { feeInWei: wrapBigNumber(fee), gasToken };
};

export const parseHistoryEventFee = (
  chain: Chain,
  feeWithGasToken: ?FeeWithGasToken,
  gasUsed: ?number,
  gasPrice: ?number,
): ?TokenValue => {
  if (feeWithGasToken?.feeInWei) {
    const {
      feeInWei,
      gasToken: { decimals, symbol, address },
    } = feeWithGasToken;
    return {
      value: wrapBigNumber(formatUnits(feeInWei, decimals)),
      address,
      symbol,
    };
  }

  if (gasUsed && gasPrice) {
    const feeValue = wrapBigNumber(gasUsed).multipliedBy(gasPrice);
    const { decimals, address, symbol } = nativeAssetPerChain[chain];
    return {
      value: wrapBigNumber(formatUnits(feeValue, decimals)),
      address,
      symbol,
    };
  }

  return null;
};

export const transactionStoreHasOldStructure = (transactionStore: TransactionsStore | CollectiblesHistoryStore) =>
  Object.values(transactionStore).some((history) => history && Array.isArray(history));
