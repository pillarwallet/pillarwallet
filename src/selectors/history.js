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

// types
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

export const archanovaAccountHistorySelector = createSelector(
  historySelector,
  accountsSelector,
  (history, accounts): ChainRecord<Transaction[]> => {
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return { ethereum: [] };

    const archanovaAccountId = getAccountId(archanovaAccount);
    if (!archanovaAccountId) return { ethereum: [] };

    return mapValues(
      history[archanovaAccountId],
      (transactions) => orderBy(transactions || [], ['createdAt'], ['desc']),
    );
  },
);

export const combinedHistorySelector = createSelector(
  historySelector,
  (history): ChainRecord<Transaction[]> => {
    const combinedHistory = Object.keys(history).reduce((combined, accountId) => {
      const accountHistory = history[accountId] ?? {};
      Object.keys(accountHistory).forEach((chain) => {
        const accountHistoryForChain = accountHistory[chain] ?? [];
        const combinedHistoryForChain = combined[chain] ?? [];

        return {
          ...combined,
          [chain]: [
            ...combinedHistoryForChain,
            ...accountHistoryForChain,
          ],
        };
      });

      return combined;
    }, {});

    return mapValues(
      combinedHistory,
      (transactions) => orderBy(transactions || [], ['createdAt'], ['desc']),
    );
  },
);
