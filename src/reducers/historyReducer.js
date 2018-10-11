// @flow
import { SET_HISTORY, ADD_TRANSACTION, SET_GAS_INFO } from 'constants/historyConstants';
import type { Transaction } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';

export type HistoryReducerState = {
  data: Transaction[],
  gasInfo: {
    gasPrice: GasInfo,
    isFetched: boolean,
  },
  isFetched: boolean,
}

export type HistoryReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  gasInfo: {
    gasPrice: {},
    isFetched: false,
  },
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
      const gasPriceInfo = action.payload;
      const isGasFetched = !!Object.keys(gasPriceInfo).length;
      return { ...state, gasInfo: { gasPrice: gasPriceInfo, isFetched: isGasFetched } };
    }
    default:
      return state;
  }
}
