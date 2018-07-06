// @flow
import { UPDATE_CONTACTS, UPDATE_SEARCH_RESULTS } from 'constants/contactsConstants';

export type ContactsReducerState = {
  data: Object[],
  contactState: ?string,
  searchResults: {
    apiUsers: Object[], // TODO: type this
    localContacts: Object[], // TODO: type this
  },
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
    case UPDATE_CONTACTS:
      return { ...state, data: action.payload };
    case UPDATE_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload };
    default:
      return state;
  }
}
