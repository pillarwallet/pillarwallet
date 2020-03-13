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
// import WalletConnect from '@walletconnect/react-native';
import {
  WALLETCONNECT_INIT_SESSIONS,
  WALLETCONNECT_SESSION_RECEIVED,
  WALLETCONNECT_SESSION_REQUEST,
  WALLETCONNECT_SESSION_APPROVED,
  WALLETCONNECT_SESSION_REJECTED,
  WALLETCONNECT_SESSION_DISCONNECTED,
  WALLETCONNECT_SESSION_KILLED,
  WALLETCONNECT_SESSIONS_KILLED,
  WALLETCONNECT_ERROR,
  WALLETCONNECT_CANCEL_REQUEST,
  WALLETCONNECT_CALL_REQUEST,
  WALLETCONNECT_CALL_REJECTED,
  WALLETCONNECT_CALL_APPROVED,
  TOGGLE_WALLET_CONNECT_PROMO_CARD,
} from 'constants/walletConnectConstants';

import type { Connector, CallRequest } from 'models/WalletConnect';

export type WalletConnectReducerState = {|
  connectors: Connector[],
  pendingConnector: ?Connector,
  waitingForSession: boolean,
  requests: CallRequest[],
  error: ?{|
    code: string,
    message: string,
  |},
  promoCardCollapsed: boolean,
|};

export type WalletConnectSessionReceived = {|
  type: 'WALLETCONNECT_SESSION_RECEIVED',
|};

export type WalletConnectSessionApproved = {|
  type: 'WALLETCONNECT_SESSION_APPROVED',
  connector: Connector,
|};

type SessionRejected = {|
  type: 'WALLETCONNECT_SESSION_REJECTED',
|};

export type WalletConnectSessionKilled = {|
  type: 'WALLETCONNECT_SESSION_KILLED',
  connector: Connector,
|};

export type WalletConnectSessionsKilled = {|
  type: 'WALLETCONNECT_SESSIONS_KILLED',
  connectors: Connector[],
|};

type SessionRequest = {|
  type: 'WALLETCONNECT_SESSION_REQUEST',
  connector: Connector,
|};

export type WalletConnectInitSessions = {|
  type: 'WALLETCONNECT_INIT_SESSIONS',
  connectors: Connector[],
|};

export type WalletConnectSessionDisconnected = {|
  type: 'WALLETCONNECT_SESSION_DISCONNECTED',
  connector: Connector,
|};

type SessionCancelRequest = {|
  type: 'WALLETCONNECT_CANCEL_REQUEST',
|};

export type WalletConnectCallRequest = {|
  type: 'WALLETCONNECT_CALL_REQUEST',
  request: CallRequest,
|};

export type WalletConnectCallRejected = {|
  type: 'WALLETCONNECT_CALL_REJECTED',
  callId: number,
|};

export type WalletConnectCallApproved = {|
  type: 'WALLETCONNECT_CALL_APPROVED',
  callId: number,
|};

export type WalletConnectError = {|
  type: 'WALLETCONNECT_ERROR',
  payload: {|
    code: string,
    message: string,
  |},
|};

export type WalletConnectTogglePromoCard = {|
  type: 'TOGGLE_WALLET_CONNECT_PROMO_CARD',
  collapsed: boolean,
|};

export type WalletConnectReducerAction =
  | WalletConnectError
  | WalletConnectInitSessions
  | WalletConnectSessionReceived
  | WalletConnectSessionApproved
  | WalletConnectSessionKilled
  | WalletConnectSessionsKilled
  | WalletConnectSessionDisconnected
  | WalletConnectCallRequest
  | WalletConnectCallRejected
  | WalletConnectCallApproved
  | SessionRequest
  | SessionCancelRequest
  | SessionRejected
  | WalletConnectTogglePromoCard;

const initialState: WalletConnectReducerState = {
  connectors: [],
  waitingForSession: false,
  pendingConnector: null,
  requests: [],
  error: null,
  promoCardCollapsed: false,
};

const removeConnector = (source: Connector[], connector: Connector): Connector[] => {
  const { peerId: connectorPeerId } = connector;

  return source.filter(({ peerId }) => peerId !== connectorPeerId);
};

const removeConnectors = (source: Connector[], connectors: Connector[]): Connector[] => {
  const peerIds = connectors.map(({ peerId }) => peerId);

  return source.filter(({ peerId }) => peerIds.indexOf(peerId) === -1);
};

const removeRequest = (source: CallRequest[], callId: number): CallRequest[] => {
  return source.filter(({ callId: sourceCallId }) => sourceCallId !== callId);
};

const walletConnectReducer = (
  state: WalletConnectReducerState = initialState,
  action: WalletConnectReducerAction,
): WalletConnectReducerState => {
  const { connectors, requests } = state;
  switch (action.type) {
    case WALLETCONNECT_INIT_SESSIONS:
      return { ...state, connectors: action.connectors };

    case WALLETCONNECT_SESSION_DISCONNECTED:
    case WALLETCONNECT_SESSION_KILLED:
      return { ...state, connectors: removeConnector(connectors, action.connector) };

    case WALLETCONNECT_SESSIONS_KILLED:
      return { ...state, connectors: removeConnectors(connectors, action.connectors) };

    case WALLETCONNECT_SESSION_APPROVED:
      return {
        ...state,
        pendingConnector: null,
        connectors: [...connectors, action.connector],
      };

    case WALLETCONNECT_SESSION_REQUEST:
      return { ...state, waitingForSession: true, pendingConnector: action.connector };

    case WALLETCONNECT_CANCEL_REQUEST:
      return { ...state, waitingForSession: false, pendingConnector: null };

    case WALLETCONNECT_SESSION_REJECTED:
      return { ...state, pendingConnector: null };

    case WALLETCONNECT_CALL_REQUEST:
      return { ...state, requests: [...requests, action.request] };

    case WALLETCONNECT_CALL_APPROVED:
    case WALLETCONNECT_CALL_REJECTED:
      return { ...state, requests: removeRequest(requests, action.callId) };

    case WALLETCONNECT_ERROR:
      return {
        ...state,
        error: action.payload,
        waitingForSession: false,
        pendingConnector: null,
      };

    case WALLETCONNECT_SESSION_RECEIVED:
      return { ...state, waitingForSession: false };

    case TOGGLE_WALLET_CONNECT_PROMO_CARD:
      return {
        ...state,
        promoCardCollapsed: action.collapsed,
      };

    default:
      return state;
  }
};
export default walletConnectReducer;
