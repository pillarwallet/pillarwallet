// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import {
  UPDATE_TX_NOTES,
  ADD_TX_NOTE,
  TX_NOTE_DECRYPTING_STARTED,
  TX_NOTE_DECRYPTING_FINISHED,
} from 'constants/txNoteConstants';
import merge from 'lodash.merge';

type TxNote = {
  text: string,
  txHash: string,
};

export type TxNoteReducerState = {
  data: TxNote[],
  isDecrypting: boolean,
}

export type TxNoteReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  isDecrypting: false,
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
          isDecrypting: false,
        },
      );
    case UPDATE_TX_NOTES:
      return {
        ...state,
        data: action.payload,
        isDecrypting: false,
      };
    case TX_NOTE_DECRYPTING_STARTED:
      return {
        ...state,
        isDecrypting: true,
      };
    case TX_NOTE_DECRYPTING_FINISHED:
      return {
        ...state,
        isDecrypting: false,
      };
    default:
      return state;
  }
}
