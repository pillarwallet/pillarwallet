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
  ADD_WALLETCONNECT_SESSION,
  SET_WALLETCONNECT_SESSIONS_IMPORTED,
  REMOVE_WALLETCONNECT_SESSION,
} from 'constants/walletConnectSessionsConstants';

import type { WalletConnectSession } from 'models/WalletConnect';


export type WalletConnectSessionsReducerAction = {
  type: string,
  payload: any,
};

export type WalletConnectSessionsReducerState = {
  sessions: WalletConnectSession[],
  isImported: boolean,
};

const initialState: WalletConnectSessionsReducerState = {
  sessions: [],
  isImported: false,
};

const walletConnectSessionsReducer = (
  state: WalletConnectSessionsReducerState = initialState,
  action: WalletConnectSessionsReducerAction,
): WalletConnectSessionsReducerState => {
  const { sessions } = state;

  switch (action.type) {
    case SET_WALLETCONNECT_SESSIONS_IMPORTED:
      return { ...state, isImported: true };

    case ADD_WALLETCONNECT_SESSION:
      return { ...state, sessions: [...sessions, action.payload.session] };

    case REMOVE_WALLETCONNECT_SESSION:
      return {
        ...state,
        sessions: sessions.filter(({ peerId }) => peerId !== action.payload.peerId),
      };

    default:
      return state;
  }
};
export default walletConnectSessionsReducer;
