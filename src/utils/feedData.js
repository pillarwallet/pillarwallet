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

import orderBy from 'lodash.orderby';

import type { Account } from 'models/Account';

import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

import { findAccountByAddress, getInactiveUserAccounts, getAccountAddress, getAccountTypeByAddress } from './accounts';
import { addressesEqual } from './assets';

export function mapTransactionsHistory(
  history: Object[],
  accounts: Account[],
  eventType: string,
  keepHashDuplicatesIfBetweenAccounts?: boolean,
  duplicatePPN?: boolean,
) {
  const concatedHistory = history
    .map(({ type, ...rest }) => {
      if (eventType === TRANSACTION_EVENT) {
        return { ...rest, transactionType: type };
      }
      return rest;
    })
    .map(({ ...rest }) => ({ ...rest, type: eventType }))
    .map(({ to, from, ...rest }) => {
      // apply to wallet accounts only if received from other account address
      const account =
        eventType !== COLLECTIBLE_TRANSACTION &&
        (findAccountByAddress(from, getInactiveUserAccounts(accounts)) ||
          findAccountByAddress(to, getInactiveUserAccounts(accounts)));

      const accountType = account ? account.type : null;

      return {
        to,
        from,
        accountType,
        ...rest,
      };
    });

  if (!keepHashDuplicatesIfBetweenAccounts) return orderBy(concatedHistory, ['createdAt'], ['desc']);

  const accountsAddresses = accounts.map((acc) => getAccountAddress(acc));
  const ascendingHistory = orderBy(concatedHistory, ['createdAt'], ['asc']);

  const historyWithTrxBetweenAcc = ascendingHistory.reduce((alteredHistory, historyItem) => {
    const { from: fromAddress, to: toAddress, hash } = historyItem;
    const isTransactionFromUsersAccount = accountsAddresses.some((userAddress) =>
      addressesEqual(fromAddress, userAddress),
    );
    const isTransactionToUsersAccount = accountsAddresses.some((userAddress) => addressesEqual(toAddress, userAddress));
    const eventWithSameHashExists = alteredHistory.some((item) => item.hash === hash);

    if (eventWithSameHashExists) {
      if (isTransactionFromUsersAccount && isTransactionToUsersAccount) {
        return [
          ...alteredHistory,
          {
            ...historyItem,
            accountType: getAccountTypeByAddress(toAddress, accounts),
            isReceived: true,
            betweenAccTrxDuplicate: true,
            _id: `${historyItem._id}_duplicate`,
            createdAt: historyItem.createdAt + 1,
          },
        ];
      }
      return alteredHistory;
    } else if (duplicatePPN) {
      return [...alteredHistory, historyItem];
    }
    return [...alteredHistory, historyItem];
  }, []);

  return orderBy(historyWithTrxBetweenAcc, ['createdAt'], ['desc']);
}
