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

// actions
import { saveDbAction } from 'actions/dbActions';

// constants
import {
  START_SYNC_CONTACTS_SMART_ADDRESSES,
  UPDATE_CONTACTS_SMART_ADDRESSES,
} from 'constants/contactsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const syncContactsSmartAddressesAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      user: { data: { walletId } },
      contacts: { data: contacts },
    } = getState();

    dispatch({ type: START_SYNC_CONTACTS_SMART_ADDRESSES });

    // get all connections keys
    const connections = contacts.map(({ id: contactId }) => ({ contactId }));

    // call the api
    const { smartWallets: contactsSmartAddresses } =
      await api.getContactsSmartAddresses(walletId, connections) || {};

    if (!contactsSmartAddresses) return;

    // store the result
    dispatch({
      type: UPDATE_CONTACTS_SMART_ADDRESSES,
      payload: contactsSmartAddresses,
    });
    dispatch(saveDbAction('contactsSmartAddresses', { contactsSmartAddresses }, true));

    // update session
    dispatch({
      type: UPDATE_SESSION,
      payload: { contactsSmartAddressesSynced: true },
    });
  };
};
