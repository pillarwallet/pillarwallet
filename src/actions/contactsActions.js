// @flow
import { UPDATE_SEARCH_RESULTS } from 'constants/contactsConstants';

export const contactsSearchAction = (query: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } }, contacts: { data: localContacts } } = getState();

    const users = await api.userSearch(query, walletId);
    dispatch({
      type: UPDATE_SEARCH_RESULTS,
      payload: users,
    });
  };
};

