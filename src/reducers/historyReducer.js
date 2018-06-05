// @flow
import { SET_HISTORY } from 'constants/historyConstants';
import type { Transaction } from 'models/Transaction';

export type HistoryReducerState = {
  data: Transaction[],
  isFetched: boolean,
}

export type HistoryReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: [],
  isFetched: false,
};

export default function assetsReducer(
  state: HistoryReducerState = initialState,
  action: HistoryReducerAction,
) {
  switch (action.type) {
    case SET_HISTORY:
      const updatedState = { data: action.payload, isFetched: true };
      return Object.assign(
        {},
        state,
        updatedState,
      );
    default:
      return state;
  }
}
