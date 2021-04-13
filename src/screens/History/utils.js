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

import { orderBy, groupBy } from 'lodash';

// Utils
import { humanizeDateString, formatDate } from 'utils/date';

// Types
import type { SectionBase } from 'utils/types/react-native';

export type HistorySection = {
  ...SectionBase<HistoryItem>,
  title: string,
};

export type HistoryItem = {|
  date: Date,
  title: string,
|};

export function useHistoryItems(): HistoryItem[] {
  return [
    { date: new Date('2021-04-12'), title: 'Hello' },
    { date: new Date('2021-04-12'), title: 'World' },
  ];
}

export const mapHistoryItemsToSections = (items: HistoryItem[]): HistorySection[] => {
  const sortedItems = orderBy(items, ['date'], ['desc']);
  const groups = groupBy(sortedItems, (item) => formatDate(item.date));

  return Object.keys(groups).map((key: string) => ({
    title: humanizeDateString(key),
    data: groups[key],
  }));
};
