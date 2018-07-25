// @flow
import { SET_HISTORY, ADD_TRANSACTION, UPDATE_HISTORY_NOTIFICATIONS } from 'constants/historyConstants';
import type { Transaction } from 'models/Transaction';
import { uniqBy } from 'utils/common';

export type HistoryReducerState = {
  data: Transaction[],
  historyNotifications: Object[],
  isFetched: boolean,
}

export type HistoryReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  historyNotifications: [],
  isFetched: false,
};

export default function historyReducer(
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
      const combinedTransactions = action.payload.transactions.concat(state.data);
      const transactions = uniqBy(combinedTransactions, 'hash');
      return Object.assign(
        {},
        state,
        { isFetched: true, data: transactions },
      );
    case UPDATE_HISTORY_NOTIFICATIONS:
      return Object.assign({}, state, { historyNotifications: action.payload });
    default:
      return state;
  }
}
