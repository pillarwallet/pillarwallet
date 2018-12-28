// @flow
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';

type TxCount = {
  lastCount: number,
  lastNonce: number,
};

export type TxCountReducerState = {
  data: TxCount
}

export type TxCountReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: {
    lastCount: 0,
    lastNonce: 0,
  },
};

export default function txCountReducer(
  state: TxCountReducerState = initialState,
  action: TxCountReducerAction,
): TxCountReducerState {
  switch (action.type) {
    case UPDATE_TX_COUNT:
      return {
        ...state,
        data: action.payload,
      };
    default:
      return state;
  }
}
