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
  SET_WALLETCONNECT_CONNECTOR_REQUEST,
  SET_WALLETCONNECT_REQUEST_ERROR,
  RESET_WALLETCONNECT_CONNECTOR_REQUEST,
  ADD_WALLETCONNECT_CALL_REQUEST,
  REMOVE_WALLETCONNECT_CALL_REQUEST,
  ADD_WALLETCONNECT_ACTIVE_CONNECTOR,
  REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR,
  RESET_WALLETCONNECT_ACTIVE_CONNECTORS,
} from 'constants/walletConnectConstants';

import type { Connector, CallRequest } from 'models/WalletConnect';

export type SetWalletConnectConnectorRequest = {|
  connectorRequest: Connector,
|};

export type AddWalletConnectCallRequest = {|
  callRequest: CallRequest,
|};

export type RemoveWalletConnectCallRequest = {|
  callId: number,
|};

export type AddWalletConnectActiveConnector = {|
  connector: CallRequest,
|};

export type RemoveWalletConnectActiveConnector = {|
  peerId: number,
|};

export type SetWalletConnectRequestError = {|
  message: string,
|};


type WalletConnectReducerActionPayload = SetWalletConnectConnectorRequest
  | AddWalletConnectCallRequest
  | RemoveWalletConnectCallRequest
  | AddWalletConnectActiveConnector
  | RemoveWalletConnectActiveConnector
  | SetWalletConnectRequestError;

export type WalletConnectReducerAction = {
  type: string,
  payload?: WalletConnectReducerActionPayload,
};

export type WalletConnectReducerState = {|
  activeConnectors: Connector[],
  connectorRequest: ?Connector,
  callRequests: CallRequest[],
  errorMessage: ?string,
|};

const initialState: WalletConnectReducerState = {
  activeConnectors: [],
  connectorRequest: null,
  callRequests: [],
  errorMessage: null,
};

const removeRequestByCallId = (
  callRequests: CallRequest[],
  callIdToRemove: number,
): CallRequest[] => callRequests.filter(({ callId }) => +callId !== callIdToRemove);

const removeConnectorByPeerId = (
  connectors: Connector[],
  peerIdToRemove: number,
): Connector[] => connectors.filter(({ peerId }) => +peerId !== peerIdToRemove);

const walletConnectReducer = (
  state: WalletConnectReducerState = initialState,
  action: WalletConnectReducerAction,
): WalletConnectReducerState => {
  const { callRequests, activeConnectors } = state;

  switch (action.type) {
    case SET_WALLETCONNECT_CONNECTOR_REQUEST:
      const { connectorRequest } = action.payload;
      return { ...state, connectorRequest: connectorRequest };

    case RESET_WALLETCONNECT_CONNECTOR_REQUEST:
      return { ...state, connectorRequest: null };

    case ADD_WALLETCONNECT_CALL_REQUEST:
      const { callRequest } = action.payload;
      return { ...state, callRequests: [...callRequests, callRequest] };

    case REMOVE_WALLETCONNECT_CALL_REQUEST:
      const { callId } = action.payload;
      return { ...state, callRequests: removeRequestByCallId(callRequests, +callId) };

    case ADD_WALLETCONNECT_ACTIVE_CONNECTOR:
      const { connector } = action.payload;
      return { ...state, activeConnectors: [...activeConnectors, connector] };

    case REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR:
      const { peerId } = action.payload;
      return { ...state, activeConnectors: removeConnectorByPeerId(activeConnectors, +peerId) };

    case RESET_WALLETCONNECT_ACTIVE_CONNECTORS:
      return { ...state, activeConnectors: [] };

    case SET_WALLETCONNECT_REQUEST_ERROR:
      const { message: errorMessage } = action.payload;
      return { ...state, errorMessage, connectorRequest: null, callRequests: [] };

    default:
      return state;
  }
};

export default walletConnectReducer;
