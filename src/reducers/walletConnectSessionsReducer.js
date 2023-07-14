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
  ADD_WALLETCONNECT_V2_SESSION,
  SET_WALLETCONNECT_SESSIONS_IMPORTED,
  REMOVE_WALLETCONNECT_SESSION,
  REMOVE_WALLETCONNECT_V2_SESSION,
  SET_IS_INITIALIZING_WALLETCONNECT_SESSIONS,
  UPDATE_WALLETCONNECT_SESSION,
} from 'constants/walletConnectSessionsConstants';

import type { WalletConnectSession, WalletConnectV2Session } from 'models/WalletConnect';

export type SetWalletConnectSessionsImportedAction = {|
  type: typeof SET_WALLETCONNECT_SESSIONS_IMPORTED,
|};

export type AddWalletConnectSessionAction = {|
  type: typeof ADD_WALLETCONNECT_SESSION,
  payload: { session: WalletConnectSession },
|};

export type RemoveWalletConnectSessionAction = {|
  type: typeof REMOVE_WALLETCONNECT_SESSION,
  payload: { peerId: string },
|};

export type SetIsInitializingWalletConnectSessions = {|
  type: typeof SET_IS_INITIALIZING_WALLETCONNECT_SESSIONS,
  payload: boolean,
|};

export type WalletConnectSessionsReducerAction =
  | SetWalletConnectSessionsImportedAction
  | AddWalletConnectSessionAction
  | RemoveWalletConnectSessionAction
  | SetIsInitializingWalletConnectSessions;

export type WalletConnectSessionsReducerState = {|
  sessions: WalletConnectSession[],
  v2Sessions: WalletConnectV2Session[],
  isImported: boolean,
  isInitializingSessions: boolean,
|};

const initialState: WalletConnectSessionsReducerState = {
  sessions: [],
  v2Sessions: [],
  isImported: false,
  isInitializingSessions: false,
};

const walletConnectSessionsReducer = (
  state: WalletConnectSessionsReducerState = initialState,
  action: WalletConnectSessionsReducerAction,
): WalletConnectSessionsReducerState => {
  const { sessions, v2Sessions: existingV2Sessions } = state;

  switch (action.type) {
    case SET_WALLETCONNECT_SESSIONS_IMPORTED:
      return { ...state, isImported: true };

    case ADD_WALLETCONNECT_SESSION:
      const { session } = action.payload;
      return { ...state, sessions: [...sessions, session] };

    case ADD_WALLETCONNECT_V2_SESSION:
      const { v2Sessions } = action.payload;
      return { ...state, v2Sessions };

    case UPDATE_WALLETCONNECT_SESSION:
      const { session: updatedSession } = action.payload;
      const index = sessions.findIndex(({ peerId: existingPeerId }) => existingPeerId === updatedSession.peerId);
      sessions[index] = updatedSession;
      return { ...state, sessions };

    case REMOVE_WALLETCONNECT_SESSION:
      const { peerId } = action.payload;
      return {
        ...state,
        sessions: sessions.filter(({ peerId: existingPeerId }) => existingPeerId !== peerId),
      };

    case REMOVE_WALLETCONNECT_V2_SESSION:
      const { topic } = action.payload;
      return {
        ...state,
        v2Sessions: existingV2Sessions?.filter(({ topic: existingTopic }) => existingTopic !== topic),
      };

    case SET_IS_INITIALIZING_WALLETCONNECT_SESSIONS:
      return {
        ...state,
        isInitializingSessions: action.payload,
      };

    default:
      return state;
  }
};
export default walletConnectSessionsReducer;
