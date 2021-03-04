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
import t from 'translations/translate';

// constants
import { SET_CONTACTS } from 'constants/contactsConstants';

// components
import Toast from 'components/Toast';

// actions
import { saveDbAction } from 'actions/dbActions';

// utils
import { addressesEqual } from 'utils/assets';

// types
import type { Contact } from 'models/Contact';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const setContactsAction = (contacts: Contact[]) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: SET_CONTACTS, payload: contacts });
    dispatch(saveDbAction('localContacts', { contacts }, true));
  };
};

export const updateContactAction = (prevEthAddress: string, contact: Contact) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { contacts: { data: contacts } } = getState();

    // filter existing
    let updatedContacts = contacts
      .filter(({ ethAddress }) => !addressesEqual(ethAddress, contact.ethAddress))
      .concat(contact);

    // remove previous if address changed
    if (!addressesEqual(contact.ethAddress, prevEthAddress)) {
      updatedContacts = updatedContacts.filter(({ ethAddress }) => !addressesEqual(ethAddress, prevEthAddress));
    }

    Toast.show({
      message: t('toast.contactUpdated', { name: contact.name }),
      emoji: 'ok_hand',
    });

    dispatch(setContactsAction(updatedContacts));
  };
};

export const addContactAction = (contact: Contact) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { contacts: { data: contacts } } = getState();

    // filter existing
    const updatedContacts = contacts
      .filter(({ ethAddress }) => !addressesEqual(ethAddress, contact.ethAddress))
      .concat(contact);

    Toast.show({
      message: t('toast.contactAdded', { name: contact.name }),
      emoji: 'handshake',
    });

    dispatch(setContactsAction(updatedContacts));
  };
};

export const deleteContactAction = (contact: Contact) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { contacts: { data: contacts } } = getState();
    const updatedContacts = contacts.filter(({ ethAddress }) => !addressesEqual(ethAddress, contact.ethAddress));

    Toast.show({
      message: t('toast.contactDeleted', { name: contact.name }),
      emoji: 'cry',
    });

    dispatch(setContactsAction(updatedContacts));
  };
};
