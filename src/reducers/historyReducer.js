// @flow
import { SET_HISTORY, ADD_TRANSACTION, SET_GAS_INFO } from 'constants/historyConstants';
import type { Transaction } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';

export type HistoryReducerState = {
  data: Transaction[],
  gasInfo: GasInfo,
  isFetched: boolean,
}

export type HistoryReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  gasInfo: {},
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
      return Object.assign(
        {},
        state,
        { isFetched: true, data: action.payload },
      );
    case SET_GAS_INFO: {
      return { ...state, gasInfo: action.payload };
    }
    default:
      return state;
  }
}
