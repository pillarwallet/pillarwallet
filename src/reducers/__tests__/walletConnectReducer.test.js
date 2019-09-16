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
  WALLETCONNECT_ERROR,
  // WALLETCONNECT_CLEAR_PENDING,
  WALLETCONNECT_CANCEL_REQUEST,
  WALLETCONNECT_INIT_SESSIONS,
  WALLETCONNECT_SESSION_DISCONNECTED,
  WALLETCONNECT_SESSIONS_KILLED,
  WALLETCONNECT_SESSION_APPROVED,
  WALLETCONNECT_SESSION_REQUEST,
  WALLETCONNECT_SESSION_REJECTED,
  WALLETCONNECT_CALL_APPROVED,
  WALLETCONNECT_CALL_REJECTED,
  WALLETCONNECT_CALL_REQUEST,
} from 'constants/walletConnectConstants';
import reducer from 'reducers/walletConnectReducer';

import type { Connector, CallRequest } from 'models/WalletConnect';

const mockConnector = (options = {}, params = {}): Connector => {
  return new WalletConnect(options, params);
};

const mockRequest = (callId: number): CallRequest => {
  return {
    callId,
    peerId: `peer-${callId}`,
    name: `peer-${callId}`,
    url: `http://requests.com/peer-${callId}`,
    icon: '',
    method: '',
    params: [],
  };
};

describe('WalletConnect reducer', () => {
  describe('WALLETCONNECT_INIT_SESSIONS', () => {
    it('stores connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const result = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        connectors: [connector1, connector2],
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
      });
    });
  });

  describe('WALLETCONNECT_SESSION_DISCONNECTED', () => {
    it('stores new connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        connectors: [connector1, connector2],
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_DISCONNECTED,
        connector: connector2,
      });

      expect(result).toMatchObject({
        connectors: [connector1],
      });
    });
  });

  describe('WALLETCONNECT_SESSIONS_KILLED', () => {
    it('stores new connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        connectors: [connector1, connector2],
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSIONS_KILLED,
        connectors: [connector1],
      });

      expect(result).toMatchObject({
        connectors: [connector2],
      });
    });
  });

  describe('WALLETCONNECT_SESSION_APPROVED', () => {
    it('updates pending and connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        connectors: [connector1],
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_APPROVED,
        connector: connector2,
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pendingConnector: null,
      });
    });
  });

  describe('WALLETCONNECT_SESSION_REQUEST', () => {
    it('updates pending', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        connectors: [connector1, connector2],
      });

      const connector3 = mockConnector();
      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_REQUEST,
        connector: connector3,
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pendingConnector: connector3,
      });
    });
  });

  describe('WALLETCONNECT_CANCEL_REQUEST', () => {
    it('updates pending', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      let state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        connectors: [connector1, connector2],
      });

      const connector3 = mockConnector();
      state = reducer(state, {
        type: WALLETCONNECT_SESSION_REQUEST,
        connector: connector3,
      });

      const result = reducer(state, {
        type: WALLETCONNECT_CANCEL_REQUEST,
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pendingConnector: null,
      });
    });
  });

  describe('WALLETCONNECT_SESSION_REJECTED', () => {
    it('updates pending', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      let state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        connectors: [connector1, connector2],
      });

      const connector3 = mockConnector();
      state = reducer(state, {
        type: WALLETCONNECT_SESSION_REQUEST,
        connector: connector3,
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_REJECTED,
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pendingConnector: null,
      });
    });
  });

  describe('handles WALLETCONNECT_ERROR', () => {
    it('stores error', () => {
      const result = reducer(undefined, {
        type: WALLETCONNECT_ERROR,
        payload: {
          code: 'error-code',
          message: 'error-message',
        },
      });

      expect(result).toMatchObject({
        error: {
          code: 'error-code',
          message: 'error-message',
        },
      });
    });
  });

  describe('WALLETCONNECT_CALL_REQUEST', () => {
    it('stores requests', () => {
      const request = mockRequest(1);

      const result = reducer(undefined, {
        type: WALLETCONNECT_CALL_REQUEST,
        request,
      });

      expect(result).toMatchObject({
        requests: [request],
      });
    });
  });

  describe('WALLETCONNECT_CALL_APPROVED', () => {
    it('removes requests', () => {
      const request = mockRequest(1);

      const state = reducer(undefined, {
        type: WALLETCONNECT_CALL_REQUEST,
        request,
      });
      const result = reducer(state, {
        type: WALLETCONNECT_CALL_APPROVED,
        callId: 1,
      });

      expect(result).toMatchObject({
        requests: [],
      });
    });
  });

  describe('WALLETCONNECT_CALL_REJECTED', () => {
    it('removes requests', () => {
      const request = mockRequest(1);

      const state = reducer(undefined, {
        type: WALLETCONNECT_CALL_REQUEST,
        request,
      });
      const result = reducer(state, {
        type: WALLETCONNECT_CALL_REJECTED,
        callId: 1,
      });

      expect(result).toMatchObject({
        requests: [],
      });
    });
  });
});
