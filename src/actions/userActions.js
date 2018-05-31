// @flow
import { UPDATE_USER } from 'constants/userConstants';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const updateLocalUserAction = (user: Object) => {
  return async (dispatch: Function) => {
    await storage.save('user', { user });
    dispatch({
      type: UPDATE_USER,
      payload: user,
    });
  };
};
