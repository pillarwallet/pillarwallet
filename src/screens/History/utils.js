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

import * as React from 'react';
import { BigNumber } from 'bignumber.js';
import { orderBy, groupBy } from 'lodash';

// Constants
import { TRANSACTION_EVENT } from 'constants/historyConstants';

// Models
import type { Transaction } from 'models/Transaction';
import type { Theme } from 'models/Theme';

// Selectors
import { useRootSelector } from 'selectors';
import { combinedHistorySelector } from 'selectors/history';

// Utils
import { humanizeDateString, formatDate } from 'utils/date';
import { mapTransactionsHistory } from 'utils/feedData';

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
  //   const accounts = useRootSelector((root) => root.accounts.data);
  //   const history = useRootSelector(combinedHistorySelector);

  //   const tokenTransactions = history
  //     .filter(({ tranType }) => tranType !== 'collectible')
  //     .filter((historyItem) => historyItem.asset !== 'BTC');

  //   const tokenItems = mapTransactionsHistory(tokenTransactions, accounts, TRANSACTION_EVENT, true, true);
  //   return [...tokenItems];
  return [
    {
      id: '1',
      type: 'sent',
      from: 'Hello',
      to: 'Yo',
      date: new Date('2021-04-13'),
      value: { symbol: 'PLR', value: BigNumber(102) },
    },
    {
      id: '2',
      type: 'received',
      from: 'Hello',
      to: 'Yo',
      date: new Date('2021-04-10'),
      value: { symbol: 'ETH', value: BigNumber(5) },
    },
  ];
}

export function mapHistoryItemsToSections(items: HistoryItem[]): HistorySection[] {
  const sortedItems = orderBy(items, ['date'], ['desc']);
  const groups = groupBy(sortedItems, (item) => formatDate(item.date));

  return Object.keys(groups).map((key: string) => ({
    title: humanizeDateString(key),
    data: groups[key],
  }));
}

export function renderHistoryItem(item: HistoryItem, theme: Theme): React.Element<any> {
  if (item.type === 'sent') {
    return (
      <HistoryListItem
        title={item.to}
        iconName="send"
        iconColor={theme.colors.negative}
        iconBorderColor={theme.colors.negativeWeak}
        rightComponent={<TokenValue symbol={item.value.symbol} value={item.value.value.negated()} />}
      />
    );
  }

  if (item.type === 'received') {
    return (
      <HistoryListItem
        title={item.to}
        iconName="send-down"
        iconColor={theme.colors.positive}
        iconBorderColor={theme.colors.positiveWeak}
        rightComponent={<TokenValue symbol={item.value.symbol} value={item.value.value} />}
      />
    );
  }

  return <HistoryListItem title="Not supported tx" />;
}
