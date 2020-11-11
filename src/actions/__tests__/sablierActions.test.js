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

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';

import {
  SET_FETCHING_STREAMS,
  SET_STREAMS,
  SET_SABLIER_GRAPH_QUERY_ERROR,
} from 'constants/sablierConstants';
import { callSubgraph, GraphQueryError } from 'services/theGraph';
import { mockSmartWalletAccount } from 'testUtils/jestSetup';

import { fetchUserStreamsAction } from '../sablierActions';

jest.mock('services/theGraph', () => ({
  callSubgraph: jest.fn(() => Promise.resolve(null)),
  GraphQueryError: jest.requireActual('services/theGraph').GraphQueryError,
}));

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

const mockStream = {
  cancellation: null,
  deposit: '1',
  id: '0',
  ratePerSecond: '10',
  recipient: '0x1',
  sender: '0x2',
  startTime: '1',
  stopTime: '2',
  timestamp: '1',
  token: {
    decimals: 0,
    id: '0x1',
    name: null,
    symbol: null,
  },
  txs: [{
    event: 'CreateStream',
    id: '0x1',
    stream: { id: '0' },
    timestamp: '1',
  }],
  withdrawals: [],
};

const initialState = {
  accounts: { data: [mockSmartWalletAccount] },
};

describe('Sablier actions', () => {
  describe('fetchUserStreamsActions', () => {
    it("fetches user's streams", async () => {
      const queryResponse = {
        incomingStreams: [mockStream],
        outgoingStreams: [mockStream, mockStream],
      };
      (callSubgraph: any).mockImplementationOnce(async () => queryResponse);

      const store = mockStore(initialState);
      const expectedActions = [
        { type: SET_FETCHING_STREAMS },
        { type: SET_STREAMS, payload: queryResponse },
      ];

      await store.dispatch(fetchUserStreamsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('marks subgraph query error when it occurrs', async () => {
      (callSubgraph: any).mockImplementationOnce(() =>
        Promise.reject(new GraphQueryError('subgraph', 'query', new Error())),
      );

      const store = mockStore(initialState);
      const expectedActions = [
        { type: SET_FETCHING_STREAMS },
        { type: SET_SABLIER_GRAPH_QUERY_ERROR },
      ];

      await store.dispatch(fetchUserStreamsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
