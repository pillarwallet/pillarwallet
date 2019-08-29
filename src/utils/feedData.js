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

import type { ContactSmartAddresses } from 'models/Contacts';
import type { Accounts } from 'models/Account';
import { getUserName } from './contacts';
import { isCaseInsensitiveMatch, uniqBy } from './common';
import { addressesEqual } from './assets';
import { getUserAccounts } from './accounts';

export function mapTransactionsHistory(
  history: Object[],
  contacts: Object[],
  contactsSmartAddresses: ContactSmartAddresses[],
  accounts: Accounts,
  eventType: string,
) {
  const userAccounts = getUserAccounts(accounts);
  const concatedHistory = history
    .map(({ ...rest }) => ({ ...rest, type: eventType }))
    .map(({ to, from, ...rest }) => {
      const contact = contacts.find(({ id: contactId, ethAddress }) => {
        if (addressesEqual(from, ethAddress) || addressesEqual(to, ethAddress)) return true;
        return contactsSmartAddresses && !!contactsSmartAddresses.find(({ userId, smartWallets = [] }) =>
          isCaseInsensitiveMatch(userId, contactId)
            && smartWallets.length
            && (addressesEqual(from, smartWallets[0]) || addressesEqual(to, smartWallets[0])),
        );
      });
      let userAccount;
      if (userAccounts.length && !contact) {
        userAccount = userAccounts.find(
          ({ ethAddress }) => addressesEqual(from, ethAddress) || addressesEqual(to, ethAddress),
        );
      }
      const username = userAccount
        ? userAccount.username
        : getUserName(contact);
      return {
        username,
        to,
        from,
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

