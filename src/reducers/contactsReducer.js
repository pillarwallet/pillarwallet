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
import {
  UPDATE_CONTACTS,
  UPDATE_SEARCH_RESULTS,
  UPDATE_CONTACTS_STATE,
  FETCHED,
  DISCONNECT_CONTACT,
} from 'constants/contactsConstants';
import type { SearchResults } from 'models/Contacts';

export type ContactsReducerState = {
  data: any,
  contactState: ?string,
  searchResults: SearchResults,
}

export type ContactsReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: [],
  contactState: null,
  searchResults: {
    apiUsers: [],
    localContacts: [],
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
    default:
      return state;
  }
}
