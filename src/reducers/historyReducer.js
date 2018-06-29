// @flow
import { SET_HISTORY, ADD_TRANSACTION } from 'constants/historyConstants';
import type { Transaction } from 'models/Transaction';

export type HistoryReducerState = {
  data: Transaction[],
  isFetched: boolean,
}

export type HistoryReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  isFetched: false,
};

export default function assetsReducer(
  state: HistoryReducerState = initialState,
  action: HistoryReducerAction,
): HistoryReducerState {
  switch (action.type) {
    case ADD_TRANSACTION:
      const trxs = state.data.concat(action.payload);
      return Object.assign(
        {},
        state,
        { data: trxs },
      );
    case SET_HISTORY:
      const transactions = state.data
        .filter(({ asset }) => asset !== action.payload.asset)
        .concat(action.payload.transactions);
      return Object.assign(
        {},
        state,
        { isFetched: true, data: transactions },
      );
    default:
      return state;
  }
}
