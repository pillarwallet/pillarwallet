// @flow
import Storage from 'services/storage';
import { UPDATE_SESSION } from 'constants/sessionConstants';

const storage = Storage.getInstance('db');

export const updateSessionNetworkStatusAction = (isOnline: boolean) => {
  return {
    type: UPDATE_SESSION,
    payload: { isOnline },
  };
};

export const checkDBConflictsAction = () => {
  return async (dispatch: Function) => {
    const dbConflicts = await storage.getConflicts();
    dispatch({
      type: UPDATE_SESSION,
      payload: { hasDBConflicts: !!dbConflicts.length },
    });
  };
};

