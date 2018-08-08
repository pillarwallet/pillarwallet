// @flow
import { UPDATE_RATES } from 'constants/ratesConstants';
import merge from 'lodash.merge';

export type RatesReducerState = {
  data: Object,
  isFetched: boolean,
}

export type RatesReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {},
  isFetched: false,
};

export default function assetsReducer(
  state: RatesReducerState = initialState,
  action: RatesReducerAction,
) {
  switch (action.type) {
    case UPDATE_RATES:
      const updatedState = { data: action.payload, isFetched: true };
      return merge(
        {},
        state,
        updatedState,
      );
    default:
      return state;
  }
}
