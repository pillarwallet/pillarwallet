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
import {
  PHONE_CONTACTS_ERROR,
  PHONE_CONTACTS_RECEIVED,
  FETCHING_PHONE_CONTACTS,
} from 'constants/phoneContactsConstants';

// models, types
import type { Dispatch } from 'reducers/rootReducer';
import type { PhoneContact } from 'models/PhoneContact';
import type {
  PhoneContactsReceivedAction,
  PhoneContactsErrorAction,
  FetchingPhoneContactsAction,
} from 'reducers/phoneContactsReducer';
import type { ReferralContact } from 'reducers/referralsReducer';

// utils
import { isValidPhone } from 'utils/validators';


const phoneContactsReceived = (contacts: ReferralContact[]): PhoneContactsReceivedAction => ({
  type: PHONE_CONTACTS_RECEIVED,
  payload: contacts,
});

const phoneContactsError = (): PhoneContactsErrorAction => ({
  type: PHONE_CONTACTS_ERROR,
});

const fetchingPhoneContacts = (): FetchingPhoneContactsAction => ({
  type: FETCHING_PHONE_CONTACTS,
});

const formatContacts = (contacts: PhoneContact[]): ReferralContact[] => {
  return contacts.reduce((array, contact) => {
    const {
      recordID,
      displayName,
      emailAddresses,
      phoneNumbers,
      thumbnailPath,
    } = contact;
    const formattedContact = {
      name: displayName,
      photo: thumbnailPath,
    };
    const arrayOfContacts = [];

    if (emailAddresses.length) {
      emailAddresses
        .reduce((uniqueEmails, emailItem) => {
          if (!uniqueEmails.some(({ email }) => email === emailItem.email)) return [...uniqueEmails, { ...emailItem }];
          return uniqueEmails;
        }, [])
        .forEach((email) => {
          arrayOfContacts.push({
            ...formattedContact,
            id: `${recordID}-${email.id}`,
            email: email.email,
          });
        });
    }

    if (phoneNumbers.length) {
      phoneNumbers
        .reduce((uniqueValidPhones, phoneItem) => {
          const phoneWithoutSpaces = phoneItem.number.replace(/\s/g, '');
          if (!uniqueValidPhones.some(({ number }) =>
            number === phoneWithoutSpaces) && isValidPhone(phoneWithoutSpaces)) {
            return [...uniqueValidPhones, { ...phoneItem, number: phoneWithoutSpaces }];
          }
          return uniqueValidPhones;
        }, [])
        .forEach((phone) => {
          arrayOfContacts.push({
            ...formattedContact,
            id: `${recordID}-${phone.id}`,
            phone: phone.number,
          });
        });
    }

    if (arrayOfContacts.length) {
      return [...array, ...arrayOfContacts];
    }
    return array;
  }, []);
};

const sortContacts = (contacts: ReferralContact[]): ReferralContact[] => {
  return contacts.sort((a, b) => {
    if (a.name > b.name) return 1;
    if (a.name < b.name) return -1;
    return 0;
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
        dispatch(fetchingPhoneContacts());
        Contacts.getAll((err, contacts) => {
          if (err === 'denied') {
            dispatch(phoneContactsError());
            return;
          }

          const formattedContacts = formatContacts(contacts);
          dispatch(phoneContactsReceived(sortContacts(formattedContacts)));
        });
      })
      .catch(() => {
        dispatch(phoneContactsError());
        return null;
      });
  };
};
