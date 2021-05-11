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
  ADD_WALLETCONNECT_SESSION,
  REMOVE_WALLETCONNECT_SESSION,
} from 'constants/walletConnectSessionsConstants';
import reducer from 'reducers/walletConnectSessionsReducer';

// types
import type { WalletConnectSession } from 'models/WalletConnect';

const mockSession = (peerId: string): $Shape<WalletConnectSession> => ({
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
  describe('ADD_WALLETCONNECT_SESSION', () => {
    it('adds new sessions', () => {
      const session1 = mockSession('session1');
      const session2 = mockSession('session2');

      const state = reducer(undefined, {
        type: ADD_WALLETCONNECT_SESSION,
        payload: { session: session1 },
      });

      const result = reducer(state, {
        type: ADD_WALLETCONNECT_SESSION,
        payload: { session: session2 },
      });

      expect(result).toMatchObject({
        sessions: [session1, session2],
      });
    });
  });

  describe('REMOVE_WALLETCONNECT_SESSION', () => {
    it('removes session', () => {
      const session1 = mockSession('session1');
      const session2 = mockSession('session2');

      let state = reducer(undefined, { type: ADD_WALLETCONNECT_SESSION, payload: { session: session1 } });
      state = reducer(state, { type: ADD_WALLETCONNECT_SESSION, payload: { session: session2 } });

      const result = reducer(state, {
        type: REMOVE_WALLETCONNECT_SESSION,
        payload: { peerId: session2.peerId },
      });

      expect(result).toMatchObject({
        sessions: [session1],
      });
    });
  });
});
