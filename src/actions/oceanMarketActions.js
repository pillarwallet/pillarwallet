// @flow
import type { Dispatch } from 'reducers/rootReducer';
import {
  GET_OCEAN_DATA_SETS_START,
  GET_OCEAN_DATA_SETS,
  GET_OCEAN_DATA_SETS_ERROR,
} from 'constants/oceanMarketConstants';

export const fetchOceanMarketDataSetsAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      dispatch({ type: GET_OCEAN_DATA_SETS_START });
      const dataSets = [];
      dispatch({ type: GET_OCEAN_DATA_SETS, payload: { dataSets } });
    } catch (e) {
      dispatch({ type: GET_OCEAN_DATA_SETS_ERROR });
    }
  };
};
