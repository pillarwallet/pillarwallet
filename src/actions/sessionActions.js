// @flow
import { UPDATE_SESSION } from 'constants/sessionConstants';

export const updateSessionNetworkStatusAction = (isOnline: boolean) => {
  return (dispatch: Function) => {
    dispatch({
      type: UPDATE_SESSION,
      payload: { isOnline },
    });
  };
};
