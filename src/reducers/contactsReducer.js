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
import merge from 'lodash.merge';
import {
  UPDATE_CONTACTS,
  UPDATE_SEARCH_RESULTS,
  UPDATE_CONTACTS_STATE,
  FETCHED,
  DISCONNECT_CONTACT,
  START_SYNC_CONTACTS_SMART_ADDRESSES,
  UPDATE_CONTACTS_SMART_ADDRESSES,
  SET_CONTACTS_SMART_ADDRESSES,
} from 'constants/contactsConstants';
import type { SearchResults, ContactSmartAddresses } from 'models/Contacts';


export type ContactsReducerState = {
  data: any,
  contactState: ?string,
  searchResults: SearchResults,
  contactsSmartAddresses: {
    addresses: ContactSmartAddresses[],
    isFetched: boolean,
  },
}

export type ContactsReducerAction = {
  type: string,
  payload: any,
}

export const initialState = {
  data: [],
  contactState: null,
  searchResults: {
    apiUsers: [],
    localContacts: [],
  },
  contactsSmartAddresses: {
    addresses: [],
    isFetched: false,
  },
};

export default function contactsReducer(
  state: ContactsReducerState = initialState,
  action: ContactsReducerAction,
) {
  switch (action.type) {
    case UPDATE_CONTACTS_STATE:
      return { ...state, contactState: action.payload };
    case UPDATE_CONTACTS:
      return { ...state, data: action.payload };
    case DISCONNECT_CONTACT:
      return {
        ...state,
        data: state.data.filter((item) => item.username !== action.payload),
      };
    case UPDATE_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload, contactState: FETCHED };
    case START_SYNC_CONTACTS_SMART_ADDRESSES:
      return merge({}, state, { contactsSmartAddresses: { isFetched: false } });
    case UPDATE_CONTACTS_SMART_ADDRESSES:
      return { ...state, contactsSmartAddresses: { addresses: action.payload, isFetched: true } };
    case SET_CONTACTS_SMART_ADDRESSES: // NOTE: we call this on app load
      return merge({}, state, { contactsSmartAddresses: { addresses: action.payload } });
    default:
      return state;
  }
}
