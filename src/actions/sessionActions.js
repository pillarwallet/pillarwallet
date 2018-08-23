// @flow
import { UPDATE_SESSION } from 'constants/sessionConstants';

export const updateSessionNetworkStatusAction = (isOnline: boolean) => {
  return {
    type: UPDATE_SESSION,
    payload: { isOnline },
  };
};
