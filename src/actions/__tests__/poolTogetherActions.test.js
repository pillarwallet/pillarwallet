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
  SET_POOL_TOGETHER_FETCHING_STATS,
  SET_POOL_TOGETHER_GRAPH_QUERY_ERROR,
  SET_POOL_TOGETHER_PRIZE_INFO,
} from 'constants/poolTogetherConstants';
import { getPoolTogetherInfo } from 'services/poolTogether';
import { GraphQueryError } from 'services/theGraph';
import { mockSmartWalletAccount } from 'testUtils/jestSetup';

import { fetchPoolPrizeInfo } from '../poolTogetherActions';

jest.mock('services/poolTogether', () => ({
  getPoolTogetherInfo: jest.fn(),
}));

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

const mockPoolStats = {
  currentPrize: '15.56',
  prizeEstimate: '16.16',
  drawDate: 1598809376000,
  remainingTimeMs: 0,
  totalPoolTicketsCount: 1628,
};

const initialState = {
  accounts: { data: [mockSmartWalletAccount] },
  poolTogether: {
    isFetchingPoolStats: false,
    poolStatsGraphQueryFailed: false,
    lastSynced: { DAI: 0 },
  },
};

describe('Pool Together actions', () => {
  describe('fetchPoolPrizeInfo', () => {
    it('fetches pool prize info for specified token', async () => {
      (getPoolTogetherInfo: any).mockImplementationOnce(async () => mockPoolStats);

      const store = mockStore(initialState);
      const expectedActions = [
        { type: SET_POOL_TOGETHER_FETCHING_STATS, payload: true },
        {
          type: SET_POOL_TOGETHER_PRIZE_INFO,
          payload: {
            symbol: 'DAI',
            updatedPoolStats: { DAI: mockPoolStats },
          },
        },
        { type: SET_POOL_TOGETHER_FETCHING_STATS, payload: false },
      ];

      await store.dispatch(fetchPoolPrizeInfo('DAI'));
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('marks subgraph query error when it occurrs', async () => {
      (getPoolTogetherInfo: any).mockImplementationOnce(() =>
        Promise.reject(new GraphQueryError('subgraph', 'query', new Error())),
      );

      const store = mockStore(initialState);
      const expectedActions = [
        { type: SET_POOL_TOGETHER_FETCHING_STATS, payload: true },
        { type: SET_POOL_TOGETHER_GRAPH_QUERY_ERROR, payload: { symbol: 'DAI' } },
        { type: SET_POOL_TOGETHER_FETCHING_STATS, payload: false },
      ];

      await store.dispatch(fetchPoolPrizeInfo('DAI'));
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
