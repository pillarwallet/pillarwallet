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

import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { Accounts } from 'models/Account';
import { findMatchingContact, getUserName } from './contacts';
import { uniqBy } from './common';
import { findAccountByAddress, getAccountName, getInactiveUserAccounts } from './accounts';

export function mapTransactionsHistory(
  history: Object[],
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
  eventType: string,
) {
  const concatedHistory = history
    .map(({ ...rest }) => ({ ...rest, type: eventType }))
    .map(({ to, from, ...rest }) => {
      const contact = findMatchingContact(to, contacts, contactsSmartAddresses)
        || findMatchingContact(from, contacts, contactsSmartAddresses);

      // apply to wallet accounts only if received from other account address
      const account = !contact
        && (findAccountByAddress(from, getInactiveUserAccounts(accounts))
          || findAccountByAddress(to, getInactiveUserAccounts(accounts))
        );

      const username = account
        ? getAccountName(account.type, accounts)
        : getUserName(contact);

      const accountType = account ? account.type : null;

      return {
        username,
        to,
        from,
        accountType,
        ...rest,
      };
    });
  return uniqBy(concatedHistory, 'hash');
}

// extending OpenSea transaction data with BCX data
export function mapOpenSeaAndBCXTransactionsHistory(openSeaHistory: Object[], BCXHistory: Object[]) {
  const concatedCollectiblesHistory = openSeaHistory
    .map(({ hash, ...rest }) => {
      const historyEntry = BCXHistory.find(({ hash: bcxHash }) => {
        return hash.toUpperCase() === bcxHash.toUpperCase();
      });

      return {
        hash,
        ...rest,
        ...historyEntry,
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  return uniqBy(concatedCollectiblesHistory, 'hash');
}

