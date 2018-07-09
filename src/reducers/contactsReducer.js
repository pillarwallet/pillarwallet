// @flow
import {
  UPDATE_CONTACTS,
  UPDATE_SEARCH_RESULTS,
  UPDATE_CONTACTS_STATE,
  FETCHED,
} from 'constants/contactsConstants';
import type { SearchResults } from 'models/Contacts';

export type ContactsReducerState = {
  data: Object[],
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
    case UPDATE_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload, contactState: FETCHED };
    default:
      return state;
  }
}
