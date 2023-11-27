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
  REMOVE_WALLETCONNECT_CALL_REQUEST,
  SET_WALLETCONNECT_CONNECTOR_REQUEST,
  ADD_WALLETCONNECT_CALL_REQUEST,
} from 'constants/walletConnectConstants';

// reducer
import reducer from 'reducers/walletConnectReducer';

// types
import type { WalletConnectCallRequest } from 'models/WalletConnect';

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
  describe('RESET_WALLETCONNECT_CONNECTOR_REQUEST', () => {
    it('removes connector request', () => {
      const state = reducer(undefined, {
        type: SET_WALLETCONNECT_CONNECTOR_REQUEST,
        payload: { currentProposal: null },
      });

      const result = reducer(state, {
        type: RESET_WALLETCONNECT_CONNECTOR_REQUEST,
      });

      expect(result).toMatchObject({
        currentProposal: null,
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
