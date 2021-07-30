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

import { orderBy, mapValues } from 'lodash';
import { createSelector } from 'reselect';

// utils
import { findFirstArchanovaAccount, getAccountId } from 'utils/accounts';

// constants
import { CHAIN } from 'constants/chainConstants';

// types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { ChainRecord } from 'models/Chain';
import type { Transaction } from 'models/Transaction';

// selectors
import {
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  accountsSelector,
} from './selectors';


export const accountHistorySelector = createSelector(
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  (history, activeAccountId): ChainRecord<Transaction[]> => {
    if (!activeAccountId) return { ethereum: [] };
    return mapValues(
      history[activeAccountId],
      (transactions) => orderBy(transactions || [], ['createdAt'], ['desc']),
    );
  },
);

export const archanovaAccountEthereumHistorySelector: Selector<Transaction[]> = createSelector(
  historySelector,
  accountsSelector,
  (history, accounts): Transaction[] => {
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return [];

    const archanovaAccountId = getAccountId(archanovaAccount);
    if (!archanovaAccountId) return [];

    const accountEthereumHistory = history[archanovaAccountId]?.[CHAIN.ETHEREUM] ?? [];

    // $FlowFixMe: fix later?
    return orderBy(accountEthereumHistory, ['createdAt'], ['desc']);
  },
);

export function isFetchingHistorySelector(root: RootReducerState) {
  return root.history.isFetching;
}
