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
import { Platform, PermissionsAndroid } from 'react-native';
import Contacts from 'react-native-contacts';

// constants
import { PHONE_CONTACTS_RECEIVED } from 'constants/phoneContactsConstants';

// models, types
import type { Dispatch } from 'reducers/rootReducer';
import type { PhoneContact } from 'models/PhoneContact';
import type { PhoneContactsReceivedAction } from 'reducers/phoneContactsReducer';

const phoneContactsReceived = (contacts: PhoneContact[]): PhoneContactsReceivedAction => ({
  type: PHONE_CONTACTS_RECEIVED,
  payload: contacts,
});

const filterContacts = (contacts: PhoneContact[]): PhoneContact[] => {
  return contacts.filter(contact =>
    contact.emailAddresses.length || contact.phoneNumbers.length);
};

const sortContacts = (contacts: PhoneContact[]): PhoneContact[] => {
  return contacts.sort((a, b) => {
    if (a.givenName === b.givenName) {
      return 0;
    }

    if (a.givenName < b.givenName) {
      return -1;
    }

    return 1;
  });
};

const askPermission = () => {
  if (Platform.OS === 'ios') {
    return Promise.resolve();
  }

  return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
    title: 'Contacts',
    message: 'This app would like to view your contacts.',
    buttonPositive: 'Allow',
  });
};

export const fetchPhoneContactsAction = () => {
  return async (dispatch: Dispatch) => {
    askPermission()
      .then(() => {
        Contacts.getAll((err, contacts) => {
          if (err === 'denied') {
            // TODO: handle error?
            return;
          }

          const filteredContacts = filterContacts(contacts);
          dispatch(phoneContactsReceived(sortContacts(filteredContacts)));
        });
      })
      .catch(() => null);
  };
};
