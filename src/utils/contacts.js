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

import get from 'lodash.get';
import { STATUS_BLOCKED } from 'constants/connectionsConstants';
import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import { addressesEqual } from './assets';
import { isCaseInsensitiveMatch } from './common';

export const getUserName = (contact: ?Object) => {
  if (!contact || !contact.username) {
    return '';
  }
  return contact.username;
};

export const getInitials = (fullName: string = '') => {
  return fullName
    .split(' ')
    .map(name => name.substring(0, 1))
    .join('')
    .toUpperCase();
};

export const findMatchingContact = (
  address: string,
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
) => {
  return contacts.find(({ id: contactId, ethAddress }) =>
    addressesEqual(address, ethAddress) || !!contactsSmartAddresses.find(({ userId, smartWallets = [] }) =>
      isCaseInsensitiveMatch(userId, contactId) && addressesEqual(address, smartWallets[0] || ''),
    ),
  );
};

export const isContactAvailable = (contact: ApiUser) => {
  // if no contact status at all then it means disconnected status
  return !!contact.status && contact.status !== STATUS_BLOCKED;
};

export const findContactIdByUsername = (contacts: ApiUser[], username: string): string => {
  const foundContact = contacts.find(contact => isCaseInsensitiveMatch(contact.username, username));
  return get(foundContact, 'id', '');
};
