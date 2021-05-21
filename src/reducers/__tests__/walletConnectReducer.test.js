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

// constants
import {
  SET_WALLETCONNECT_REQUEST_ERROR,
  RESET_WALLETCONNECT_CONNECTOR_REQUEST,
  SET_WALLETCONNECT_CONNECTOR_REQUEST,
  REMOVE_WALLETCONNECT_CALL_REQUEST,
  ADD_WALLETCONNECT_CALL_REQUEST,
  ADD_WALLETCONNECT_ACTIVE_CONNECTOR,
  REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR,
  RESET_WALLETCONNECT_ACTIVE_CONNECTORS,
} from 'constants/walletConnectConstants';

// services
import { createConnector } from 'services/walletConnect';

// reducer
import reducer from 'reducers/walletConnectReducer';

// types
import type { WalletConnectCallRequest, WalletConnectConnector } from 'models/WalletConnect';


// $FlowFixMe: this always returns WalletConnectConnector
const mockConnector = (): WalletConnectConnector => createConnector({ uri: 'wc://mock' });

const mockRequest = (callId: number): WalletConnectCallRequest => {
  return {
    callId,
    peerId: `peer-${callId}`,
    chainId: 1,
    name: `peer-${callId}`,
    url: `http://requests.com/peer-${callId}`,
    icon: '',
    method: '',
    params: [],
  };
};

describe('WalletConnect reducer', () => {
  describe('ADD_WALLETCONNECT_ACTIVE_CONNECTOR', () => {
    it('stores connector', () => {
      const connector1 = mockConnector();

      const result = reducer(undefined, {
        type: ADD_WALLETCONNECT_ACTIVE_CONNECTOR,
        payload: { connector: connector1 },
      });

      expect(result).toMatchObject({
        activeConnectors: [connector1],
      });
    });
  });

  describe('REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR', () => {
    it('removes connector', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      let state = reducer(undefined, { type: ADD_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { connector: connector1 } });
      state = reducer(state, { type: ADD_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { connector: connector2 } });

      const result = reducer(state, {
        type: REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR,
        // $FlowFixMe – peerId is present on new connector, no extra checks needed here
        payload: { peerId: connector1.peerId },
      });

      expect(result).toMatchObject({
        activeConnectors: [connector2],
      });
    });
  });

  describe('RESET_WALLETCONNECT_ACTIVE_CONNECTORS', () => {
    it('removes all connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      let state = reducer(undefined, { type: ADD_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { connector: connector1 } });
      state = reducer(state, { type: ADD_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { connector: connector2 } });

      const result = reducer(state, {
        type: RESET_WALLETCONNECT_ACTIVE_CONNECTORS,
      });

      expect(result).toMatchObject({
        activeConnectors: [],
      });
    });
  });

  describe('SET_WALLETCONNECT_CONNECTOR_REQUEST', () => {
    it('adds connector request', () => {
      const connector1 = mockConnector();

      const result = reducer(undefined, {
        type: SET_WALLETCONNECT_CONNECTOR_REQUEST,
        payload: { connectorRequest: connector1 },
      });

      expect(result).toMatchObject({
        connectorRequest: connector1,
      });
    });

    it('replaces connector request', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: SET_WALLETCONNECT_CONNECTOR_REQUEST,
        payload: { connectorRequest: connector1 },
      });

      const result = reducer(state, {
        type: SET_WALLETCONNECT_CONNECTOR_REQUEST,
        payload: { connectorRequest: connector2 },
      });

      expect(result).toMatchObject({
        connectorRequest: connector2,
      });
    });
  });

  describe('RESET_WALLETCONNECT_CONNECTOR_REQUEST', () => {
    it('removes connector request', () => {
      const connector1 = mockConnector();

      const state = reducer(undefined, {
        type: SET_WALLETCONNECT_CONNECTOR_REQUEST,
        payload: { connectorRequest: connector1 },
      });

      const result = reducer(state, {
        type: RESET_WALLETCONNECT_CONNECTOR_REQUEST,
      });

      expect(result).toMatchObject({
        connectorRequest: null,
      });
    });
  });

  describe('SET_WALLETCONNECT_REQUEST_ERROR', () => {
    it('stores error', () => {
      const result = reducer(undefined, {
        type: SET_WALLETCONNECT_REQUEST_ERROR,
        payload: { message: 'error-message' },
      });

      expect(result).toMatchObject({
        errorMessage: 'error-message',
      });
    });

    it('stores error and resets pending requests', () => {
      const connector = mockConnector();
      let state = reducer(undefined, { type: SET_WALLETCONNECT_CONNECTOR_REQUEST, payload: { connector } });

      const callRequest = mockRequest(1);
      state = reducer(state, { type: ADD_WALLETCONNECT_CALL_REQUEST, payload: { callRequest } });

      const result = reducer(state, {
        type: SET_WALLETCONNECT_REQUEST_ERROR,
        payload: { message: 'error-message' },
      });

      expect(result).toMatchObject({
        errorMessage: 'error-message',
        connectorRequest: null,
        callRequests: [],
      });
    });
  });

  describe('ADD_WALLETCONNECT_CALL_REQUEST', () => {
    it('adds request', () => {
      const callRequest = mockRequest(1);

      const result = reducer(undefined, {
        type: ADD_WALLETCONNECT_CALL_REQUEST,
        payload: { callRequest },
      });

      expect(result).toMatchObject({
        callRequests: [callRequest],
      });
    });

    it('adds multiple request', () => {
      const callRequest1 = mockRequest(1);
      const callRequest2 = mockRequest(2);

      const state = reducer(undefined, {
        type: ADD_WALLETCONNECT_CALL_REQUEST,
        payload: { callRequest: callRequest1 },
      });

      const result = reducer(state, {
        type: ADD_WALLETCONNECT_CALL_REQUEST,
        payload: { callRequest: callRequest2 },
      });

      expect(result).toMatchObject({
        callRequests: [callRequest1, callRequest2],
      });
    });
  });

  describe('REMOVE_WALLETCONNECT_CALL_REQUEST', () => {
    it('removes request', () => {
      const mockCallId = 1;
      const callRequest = mockRequest(mockCallId);

      const state = reducer(undefined, {
        type: ADD_WALLETCONNECT_CALL_REQUEST,
        payload: { callRequest },
      });

      const result = reducer(state, {
        type: REMOVE_WALLETCONNECT_CALL_REQUEST,
        payload: { callId: mockCallId },
      });

      expect(result).toMatchObject({
        callRequests: [],
      });
    });
  });
});
