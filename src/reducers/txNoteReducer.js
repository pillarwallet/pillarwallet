// @flow
import {
  UPDATE_TX_NOTES,
  ADD_TX_NOTE,
} from 'constants/txNoteConstants';
import merge from 'lodash.merge';

type TxNote = {
  text: string,
  txHash: string,
};

export type TxNoteReducerState = {
  data: TxNote[],
  isFetching: boolean,
}

export type TxNoteReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  isFetching: false,
};

export default function txNoteReducer(
  state: TxNoteReducerState = initialState,
  action: TxNoteReducerAction,
): TxNoteReducerState {
  switch (action.type) {
    case ADD_TX_NOTE:
      const { txNote } = action.payload;
      const txNotes = state.data || [];
      const allTxNotes = [txNote, ...txNotes];
      return merge(
        {},
        state,
        {
          data: allTxNotes,
          isFetching: false,
        },
      );
    case UPDATE_TX_NOTES:
      return {
        ...state,
        data: action.payload,
        isFetching: false,
      };
    default:
      return state;
  }
}
