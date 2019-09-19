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
import WalletConnect from '@walletconnect/react-native';
import {
  WALLETCONNECT_INIT_SESSIONS,
  WALLETCONNECT_SESSION_REQUEST,
  WALLETCONNECT_SESSION_APPROVED,
  WALLETCONNECT_SESSION_REJECTED,
  WALLETCONNECT_SESSION_DISCONNECTED,
  WALLETCONNECT_SESSION_KILLED,
  WALLETCONNECT_CLEAR_PENDING,
  WALLETCONNECT_ERROR,
  WALLETCONNECT_CANCEL_REQUEST,
} from 'constants/walletConnectConstants';

export type WalletConnectReducerState = {
  connectors: WalletConnect[],
  pending: WalletConnect[],
  requests: Array<{
    peerId: string,
    peerMeta: Object,
    payload: Object,
  }>,
  error: ?{
    code: string,
    message: string,
  },
  waitingRequest: ?string,
};

type SessionApproved = {
  type: 'WALLETCONNECT_SESSION_APPROVED',
  payload: {
    pending: WalletConnect[],
    connectors: WalletConnect[],
  },
  pending: number,
};

type SessionRejected = {
  type: 'WALLETCONNECT_SESSION_REJECTED',
  payload: WalletConnect[],
};

type SessionKilled = {
  type: 'WALLETCONNECT_SESSION_KILLED',
  payload: WalletConnect[],
};

type SessionRequest = {
  type: 'WALLETCONNECT_SESSION_REQUEST',
  payload: {
    pending: WalletConnect[],
    clientId: string,
  },
};

type InitSessions = {
  type: 'WALLETCONNECT_INIT_SESSIONS',
  payload: WalletConnect[],
};

type SessionDisconnected = {
  type: 'WALLETCONNECT_SESSION_DISCONNECTED',
  payload: WalletConnect[],
};

type SessionCancelRequest = {
  type: 'WALLETCONNECT_CANCEL_REQUEST',
  payload: WalletConnect[],
};

type WalletConnectClearPending = {
  type: 'WALLETCONNECT_CLEAR_PENDING',
  payload: WalletConnect[],
};

type WalletConnectError = {
  type: 'WALLETCONNECT_ERROR',
  payload: {
    code: string,
    message: string,
  },
};

export type WalletConnectReducerAction =
  | WalletConnectError
  | SessionApproved
  | WalletConnectClearPending
  | InitSessions
  | SessionRequest
  | SessionCancelRequest
  | SessionRejected
  | SessionKilled
  | SessionDisconnected;

const initialState = {
  connectors: [],
  pending: [],
  requests: [],
  error: null,
  waitingRequest: null,
};

const walletConnectReducer = (
  state: WalletConnectReducerState = initialState,
  action: WalletConnectReducerAction,
): WalletConnectReducerState => {
  switch (action.type) {
    case WALLETCONNECT_INIT_SESSIONS:
    case WALLETCONNECT_SESSION_DISCONNECTED:
    case WALLETCONNECT_SESSION_KILLED:
      return { ...state, connectors: action.payload };

    case WALLETCONNECT_SESSION_APPROVED:
      return {
        ...state,
        pending: action.payload.pending,
        connectors: action.payload.connectors,
        waitingRequest: null,
      };

    case WALLETCONNECT_SESSION_REQUEST:
      return { ...state, pending: action.payload.pending, waitingRequest: action.payload.clientId };

    case WALLETCONNECT_CANCEL_REQUEST:
      return { ...state, pending: action.payload, waitingRequest: null };

    case WALLETCONNECT_SESSION_REJECTED:
    case WALLETCONNECT_CLEAR_PENDING:
      return { ...state, pending: action.payload, waitingRequest: null };

    case WALLETCONNECT_ERROR:
      return { ...state, error: action.payload, waitingRequest: null };

    default:
      return state;
  }
};
export default walletConnectReducer;
