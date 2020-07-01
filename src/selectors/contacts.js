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

import { createSelector } from 'reselect';
import { isCaseInsensitiveMatch } from 'utils/common';
import { contactsSelector, contactsSmartWalletAddressesSelector } from './selectors';

export const contactsForSendFlowSelector = createSelector(contactsSelector, (contacts) => {
  return contacts.map((contact) => {
    const {
      username,
      profileImage,
      updatedAt,
      ethAddress,
    } = contact;

    return {
      name: username,
      value: ethAddress,
      imageUrl: profileImage,
      lastUpdateTime: updatedAt,
      ...contact,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
});

export const contactsByWalletForSendSelector =
  createSelector(contactsForSendFlowSelector, contactsSmartWalletAddressesSelector,
    (contacts, contactsSmartWalletAddresses) => {
      return contacts
        .map(contact => {
          const { smartWallets = [] } = contactsSmartWalletAddresses.find(
            ({ userId }) => contact.id && isCaseInsensitiveMatch(userId, contact.id),
          ) || {};
          return {
            ...contact,
            ethAddress: smartWallets[0] || contact.ethAddress,
            hasSmartWallet: !!smartWallets.length,
            opacity: !smartWallets.length ? 0.3 : 1,
          };
        })
        .sort((a, b) => {
          // keep as it is
          if (a.hasSmartWallet === b.hasSmartWallet
            || (a.sortToTop && a.sortToTop === b.sortToTop)) return 0;
          // sort user accounts to top
          if (a.sortToTop || b.sortToTop) return 1;
          // sort smart wallet contacts to top
          return a.hasSmartWallet ? -1 : 1;
        });
    },
  );
