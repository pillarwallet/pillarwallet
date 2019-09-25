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
  WALLETCONNECT_SESSION_ADDED,
  WALLETCONNECT_SESSION_REMOVED,
  WALLETCONNECT_SESSIONS_REMOVED,
} from 'constants/walletConnectSessionsConstants';
import reducer from 'reducers/walletConnectSessionsReducer';
import type { Session } from 'models/WalletConnect';

const mockSession = (peerId: string): Session => ({
  peerId,
  key: `key-${peerId}`,
  connected: true,
  accounts: [],
  chainId: 1,
  bridge: '',
  clientId: `client-${peerId}`,
  handshakeId: 1,
  handshakeTopic: '',
});

describe('WalletConnectSessions reducer', () => {
  describe('WALLETCONNECT_SESSIONS_LOADED', () => {
    it('stores new session', () => {
      const session1 = mockSession('session1');
      const session2 = mockSession('session2');

      const result = reducer(undefined, {
        type: WALLETCONNECT_SESSIONS_LOADED,
        sessions: [session1, session2],
      });

      expect(result).toMatchObject({
        sessions: [session1, session2],
      });
    });
  });

  describe('WALLETCONNECT_SESSION_ADDED', () => {
    it('stores new session', () => {
      const session1 = mockSession('session1');
      const session2 = mockSession('session2');

      const state = reducer(undefined, {
        type: WALLETCONNECT_SESSION_ADDED,
        session: session1,
      });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_ADDED,
        session: session2,
      });

      expect(result).toMatchObject({
        sessions: [session1, session2],
      });
    });
  });

  describe('WALLETCONNECT_SESSION_REMOVED', () => {
    it('updates the sessions', () => {
      const session1 = mockSession('session1');
      const session2 = mockSession('session2');

      let state = reducer(undefined, { type: WALLETCONNECT_SESSION_ADDED, session: session1 });
      state = reducer(state, { type: WALLETCONNECT_SESSION_ADDED, session: session2 });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSION_REMOVED,
        peerId: session2.peerId,
      });

      expect(result).toMatchObject({
        sessions: [session1],
      });
    });
  });

  describe('WALLETCONNECT_SESSIONS_REMOVED', () => {
    it('updates the sessions', () => {
      const session1 = mockSession('session1');
      const session2 = mockSession('session2');

      let state = reducer(undefined, { type: WALLETCONNECT_SESSION_ADDED, session: session1 });
      state = reducer(state, { type: WALLETCONNECT_SESSION_ADDED, session: session2 });

      const result = reducer(state, {
        type: WALLETCONNECT_SESSIONS_REMOVED,
        peerIds: [session2.peerId, session1.peerId],
      });

      expect(result).toMatchObject({
        sessions: [],
      });
    });
  });
});
