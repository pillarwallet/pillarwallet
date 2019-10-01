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
  WALLETCONNECT_SESSIONS_LOADED,
  WALLETCONNECT_SESSIONS_IMPORTED,
  WALLETCONNECT_SESSION_ADDED,
  WALLETCONNECT_SESSION_REMOVED,
  WALLETCONNECT_SESSIONS_REMOVED,
} from 'constants/walletConnectSessionsConstants';

import type { Session } from 'models/WalletConnect';

export type WalletConnectSessionsReducerState = {
  isImported: boolean,
  sessions: Session[],
};

export type WalletConnectSessionsImported = {
  type: 'WALLETCONNECT_SESSIONS_IMPORTED',
};

export type WalletConnectSessionsLoaded = {
  type: 'WALLETCONNECT_SESSIONS_LOADED',
  sessions: Session[],
};

export type WalletConnectSessionAdded = {
  type: 'WALLETCONNECT_SESSION_ADDED',
  session: Session,
};

export type WalletConnectSessionRemoved = {
  type: 'WALLETCONNECT_SESSION_REMOVED',
  peerId: string,
};

export type WalletConnectSessionsRemoved = {
  type: 'WALLETCONNECT_SESSIONS_REMOVED',
  peerIds: string[],
};

export type WalletConnectSessionsReducerAction =
  | WalletConnectSessionsImported
  | WalletConnectSessionsLoaded
  | WalletConnectSessionAdded
  | WalletConnectSessionsRemoved
  | WalletConnectSessionRemoved;

const initialState = {
  sessions: [],
  isImported: false,
};

const walletConnectSessionsReducer = (
  state: WalletConnectSessionsReducerState = initialState,
  action: WalletConnectSessionsReducerAction,
): WalletConnectSessionsReducerState => {
  const { sessions } = state;

  switch (action.type) {
    case WALLETCONNECT_SESSIONS_IMPORTED:
      return { ...state, isImported: true };

    case WALLETCONNECT_SESSIONS_LOADED:
      return { ...state, sessions: action.sessions };

    case WALLETCONNECT_SESSION_ADDED:
      return {
        ...state,
        sessions: [...sessions, action.session],
      };

    case WALLETCONNECT_SESSION_REMOVED:
      const { peerId: actionPeerId } = action;

      return {
        ...state,
        sessions: sessions.filter(({ peerId }) => peerId !== actionPeerId),
      };

    case WALLETCONNECT_SESSIONS_REMOVED:
      const { peerIds } = action;

      return {
        ...state,
        sessions: sessions.filter(({ peerId }) => peerIds.indexOf(peerId) === -1),
      };

    default:
      return state;
  }
};
export default walletConnectSessionsReducer;
