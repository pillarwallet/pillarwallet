// @flow
import { SET_ICOS } from 'constants/marketConstants';

export const fetchICOsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const icos = await api.fetchICOs();
    dispatch({
      type: SET_ICOS,
      payload: icos,
    });
  };
};
