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
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// constants
import {
  PHONE_CONTACTS_ERROR,
  PHONE_CONTACTS_RECEIVED,
  PHONE_CONTACTS_ACCESS_DENIED,
  FETCHING_PHONE_CONTACTS,
} from 'constants/phoneContactsConstants';

// models, types
import type { Dispatch } from 'reducers/rootReducer';
import type {
  PhoneContact,
  PhoneContactEmail,
  PhoneContactPhone,
} from 'models/PhoneContact';
import type {
  PhoneContactsReceivedAction,
  PhoneContactsErrorAction,
  FetchingPhoneContactsAction,
} from 'reducers/phoneContactsReducer';
import type { ReferralContact } from 'reducers/referralsReducer';

// utils
import { stringWithoutSpaces } from 'utils/common';

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

const filterDuplicateEmails = (emailAddresses: PhoneContactEmail[]): PhoneContactEmail[] => {
  return emailAddresses.reduce((uniqueEmails, emailItem) => {
    if (!uniqueEmails.some(({ email }) => email === emailItem.email)) {
      return [...uniqueEmails, { ...emailItem }];
    }

    return uniqueEmails;
  }, []);
};

const filterDuplicatePhones = (phoneNumbers: PhoneContactPhone[]): PhoneContactPhone[] => {
  return phoneNumbers.reduce((uniqueValidPhones, phoneItem) => {
    const phoneWithoutSpaces = stringWithoutSpaces(phoneItem.number).replace(/[()-]/g, '');

    if (!uniqueValidPhones.some(({ number }) => number === phoneWithoutSpaces)) {
      return [...uniqueValidPhones, { ...phoneItem, number: phoneWithoutSpaces }];
    }

    return uniqueValidPhones;
  }, []);
};

const formatContacts = (contacts: PhoneContact[]): ReferralContact[] => {
  return contacts.reduce((array, contact) => {
    const {
      recordID,
      displayName,
      givenName,
      familyName,
      emailAddresses,
      phoneNumbers,
      thumbnailPath,
    } = contact;
    const fullName = givenName && familyName ? `${givenName} ${familyName}` : (givenName || familyName);
    const name = displayName || fullName;
    const arrayOfContacts = [];

    if (!isEmpty(emailAddresses)) {
      filterDuplicateEmails(emailAddresses)
        .forEach((contactEmail, index) => {
          const { email } = contactEmail;

          arrayOfContacts.push({
            name: name || email,
            photo: thumbnailPath,
            id: `${recordID}-email-${index}`,
            email,
          });
        });
    }

    if (!isEmpty(phoneNumbers)) {
      filterDuplicatePhones(phoneNumbers)
        .forEach((contactPhone, index) => {
          const { number: phone } = contactPhone;

          arrayOfContacts.push({
            name: name || phone,
            photo: thumbnailPath,
            id: `${recordID}-phone-${index}`,
            phone,
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
    title: t('alert.contactsPermission.title'),
    message: t('alert.contactsPermission.message'),
    buttonPositive: t('alert.contactsPermission.button.ok'),
  });
};

export const fetchPhoneContactsAction = () => {
  return async (dispatch: Dispatch) => {
    askPermission()
      .then(() => {
        dispatch(fetchingPhoneContacts());
        Contacts.getAll((err, contacts) => {
          if (typeof err === 'string' && err.toLowerCase() === PHONE_CONTACTS_ACCESS_DENIED) {
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
