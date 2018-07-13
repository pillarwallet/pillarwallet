// @flow
import { UPDATE_SEARCH_RESULTS, FETCHING, UPDATE_CONTACTS_STATE } from 'constants/contactsConstants';
import { excludeLocalContacts } from 'utils/contacts';

export const contactsSearchAction = (query: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } }, contacts: { data: localContacts } } = getState();

    dispatch({
      type: UPDATE_CONTACTS_STATE,
      payload: FETCHING,
    });

    let apiUsers = await api.userSearch(query, walletId);
    apiUsers = excludeLocalContacts(apiUsers, localContacts);

    const myContacts = localContacts.filter(contact => {
      return contact.username.toUpperCase().indexOf(query.toUpperCase()) > -1;
    });

    dispatch({
      type: UPDATE_SEARCH_RESULTS,
      payload: {
        apiUsers,
        localContacts: myContacts,
      },
    });
  };
};

