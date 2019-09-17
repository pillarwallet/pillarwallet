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
  WALLETCONNECT_CLEAR_PENDING,
  WALLETCONNECT_CANCEL_REQUEST,
  WALLETCONNECT_INIT_SESSIONS,
  WALLETCONNECT_SESSION_DISCONNECTED,
  WALLETCONNECT_SESSION_KILLED,
  WALLETCONNECT_SESSION_APPROVED,
  WALLETCONNECT_SESSION_REQUEST,
  WALLETCONNECT_SESSION_REJECTED,
} from 'constants/walletConnectConstants';
import reducer from 'reducers/walletConnectReducer';

const mockConnector = (options = {}, params = {}) => {
  return new WalletConnect(options, params);
};

describe('WalletConnect reducer', () => {
  describe('WALLETCONNECT_INIT_SESSIONS', () => {
    it('stores connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const result = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        payload: [connector1, connector2],
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
        payload: [connector1, connector2],
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_DISCONNECTED,
        payload: [connector1],
      });

      expect(result).toMatchObject({
        connectors: [connector1],
      });
    });
  });

  describe('WALLETCONNECT_SESSION_KILLED', () => {
    it('stores new connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        payload: [connector1, connector2],
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_KILLED,
        payload: [connector1],
      });

      expect(result).toMatchObject({
        connectors: [connector1],
      });
    });
  });

  describe('WALLETCONNECT_SESSION_APPROVED', () => {
    it('updates pending and connectors', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        payload: [connector1, connector2],
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_APPROVED,
        payload: {
          pending: [],
          connectors: [connector1],
        },
        pending: 0,
      });

      expect(result).toMatchObject({
        pending: [],
        connectors: [connector1],
        waitingRequest: null,
      });
    });
  });

  describe('WALLETCONNECT_SESSION_REQUEST', () => {
    it('updates pending', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      const state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        payload: [connector1, connector2],
      });

      const connector3 = mockConnector();
      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_REQUEST,
        payload: {
          pending: [connector3],
          clientId: 'client-n',
        },
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pending: [connector3],
        waitingRequest: 'client-n',
      });
    });
  });

  describe('WALLETCONNECT_CANCEL_REQUEST', () => {
    it('updates pending', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      let state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        payload: [connector1, connector2],
      });

      const connector3 = mockConnector();
      state = reducer(state, {
        type: WALLETCONNECT_SESSION_REQUEST,
        payload: {
          pending: [connector3],
          clientId: 'client-n',
        },
      });

      const result = reducer(state, {
        type: WALLETCONNECT_CANCEL_REQUEST,
        payload: [],
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pending: [],
        waitingRequest: null,
      });
    });
  });

  describe('WALLETCONNECT_SESSION_REJECTED', () => {
    it('updates pending', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      let state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        payload: [connector1, connector2],
      });

      const connector3 = mockConnector();
      state = reducer(state, {
        type: WALLETCONNECT_SESSION_REQUEST,
        payload: {
          pending: [connector3],
          clientId: 'client-n',
        },
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_REJECTED,
        payload: [],
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pending: [],
        waitingRequest: null,
      });
    });
  });

  describe('handles WALLETCONNECT_CLEAR_PENDING', () => {
    it('updates pending', () => {
      const connector1 = mockConnector();
      const connector2 = mockConnector();

      let state = reducer(undefined, {
        type: WALLETCONNECT_INIT_SESSIONS,
        payload: [connector1, connector2],
      });

      const connector3 = mockConnector();
      state = reducer(state, {
        type: WALLETCONNECT_SESSION_REQUEST,
        payload: {
          pending: [connector3],
          clientId: 'client-n',
        },
      });
      const result = reducer(state, {
        type: WALLETCONNECT_CLEAR_PENDING,
        payload: [],
      });

      expect(result).toMatchObject({
        connectors: [connector1, connector2],
        pending: [],
        waitingRequest: null,
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
});
