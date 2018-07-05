// @flow
import { UPDATE_USER, UPDATE_SEARCH_RESULTS } from 'constants/userConstants';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const updateLocalUserAction = (user: Object, forceRewrite: boolean = false) => {
  return async (dispatch: Function) => {
    await storage.save('user', { user }, forceRewrite);
    dispatch({
      type: UPDATE_USER,
      payload: user,
    });
  };
};

export const usersSearchAction = (query: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } } } = getState();

    const users = await api.search(query, walletId);
    dispatch({
      type: UPDATE_SEARCH_RESULTS,
      payload: users,
    });
  };
};
