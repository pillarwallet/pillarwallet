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

import { getUserName } from './contacts';
import { uniqBy } from './common';
import { addressesEqual } from './assets';

export function mapTransactionsHistory(history: Object[], contacts: Object[], eventType: string) {
  const concatedHistory = history
    .map(({ ...rest }) => ({ ...rest, type: eventType }))
    .map(({ to, from, ...rest }) => {
      const contact = contacts.find(({ ethAddress }) => {
        return addressesEqual(from, ethAddress) || addressesEqual(to, ethAddress);
      });

      return {
        username: getUserName(contact),
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

