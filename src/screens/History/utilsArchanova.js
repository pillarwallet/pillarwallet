// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import { BigNumber } from 'bignumber.js';
import { orderBy, groupBy } from 'lodash';

// Constants
import { TRANSACTION_EVENT } from 'constants/historyConstants';

// Models
import type { Transaction } from 'models/Transaction';

// Selectors
import { useRootSelector } from 'selectors';
import { combinedHistorySelector } from 'selectors/history';

// Utils
import { getAccountAddress } from 'utils/accounts';
import { addressesEqual } from 'utils/assets';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { HistoryItem } from 'models/History';

// Local
import HistoryListItem, { TokenValue } from './HistoryListItem';

export type HistorySection = {
  ...SectionBase<HistoryItem>,
  title: string,
};

export function useHistoryItems(): HistoryItem[] {
  const accounts = useRootSelector((root) => root.accounts.data);
  const history = useRootSelector(combinedHistorySelector);

  const addresses = accounts.map((acc) => getAccountAddress(acc));

  const tokenTransactions = history
    .filter(({ tranType }) => tranType !== 'collectible')
    .filter((historyItem) => historyItem.asset !== 'BTC');

  return tokenTransactions.map((tx) => mapTokenTransactionToHistoryItem(tx, addresses));

  //   const tokenItems = mapTransactionsHistory(tokenTransactions, accounts, TRANSACTION_EVENT, true, true);
  //   return [...tokenItems];
  // return [
  //   {
  //     id: '1',
  //     type: 'sent',
  //     from: 'Hello',
  //     to: 'Yo',
  //     date: new Date('2021-04-13'),
  //     value: { symbol: 'PLR', value: BigNumber(102) },
  //   },
  //   {
  //     id: '2',
  //     type: 'received',
  //     from: 'Hello',
  //     to: 'Yo',
  //     date: new Date('2021-04-10'),
  //     value: { symbol: 'ETH', value: BigNumber(5) },
  //   },
  // ];
}

function mapTokenTransactionToHistoryItem(tx: Transaction, userAddresses: string[]): HistoryItem {
  const isFromUser = userAddresses.some((address) => addressesEqual(tx.from, address));
  const isToUser = userAddresses.some((address) => addressesEqual(tx.to, address));

  if (isFromUser) {
    console.log('TX SEND', tx);
    return {
      type: 'sent',
      id: tx._id,
      date: new Date(tx.createdAt * 1000),
      from: tx.from,
      to: tx.to,
      value: {
        symbol: tx.asset,
        value: BigNumber(tx.value).dividedBy(1e18),
      },
    };
  }

  if (isToUser) {
    console.log('TX RECEIVE', tx);
    return {
      type: 'received',
      id: tx._id,
      date: new Date(tx.createdAt * 1000),
      from: tx.from,
      to: tx.to,
      value: {
        symbol: tx.asset,
        value: BigNumber(tx.value).dividedBy(1e18),
      },
    };
  }

  return {
    type: 'unknown',
    id: tx._id,
    date: new Date(tx.createdAt * 1000),
  };
}
