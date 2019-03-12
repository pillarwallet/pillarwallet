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
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';

export type ConnectionKeyPairsReducerState = {
  data: Object[],
  lastConnectionKeyIndex: number,
}

export type ConnectionKeyPairsReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  lastConnectionKeyIndex: -1,
};

export default function connectionKeyPairsReducer(
  state: ConnectionKeyPairsReducerState = initialState,
  action: ConnectionKeyPairsReducerAction,
): ConnectionKeyPairsReducerState {
  switch (action.type) {
    case UPDATE_CONNECTION_KEY_PAIRS:
      let lastConnIndex = -1;
      if (action.payload && action.payload.length > 0) {
        lastConnIndex = action.payload[action.payload.length].connIndex;
      }
      return {
        ...state,
        data: action.payload,
        lastConnectionKeyIndex: lastConnIndex,
      };
    default:
      return state;
  }
}
