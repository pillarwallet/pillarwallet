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

import { REHYDRATE } from 'redux-persist';
import {
  SET_POOL_TOGETHER_PRIZE_INFO,
  SET_POOL_TOGETHER_GRAPH_QUERY_ERROR,
} from 'constants/poolTogetherConstants';
import reducer from 'reducers/poolTogetherReducer';

describe('Pool Together reducer', () => {
  describe('handles subgraph query status', () => {
    it('marks error when it occurs', () => {
      const action = {
        type: SET_POOL_TOGETHER_GRAPH_QUERY_ERROR,
        payload: { symbol: 'DAI' },
      };

      const state = reducer(undefined, action);
      expect(state).toMatchObject({
        poolStatsGraphQueryFailed: {
          DAI: true,
        },
      });
    });

    it('resets failure flag when receiving data', () => {
      const actions = [{
        type: SET_POOL_TOGETHER_GRAPH_QUERY_ERROR,
        payload: { symbol: 'DAI' },
      }, {
        type: SET_POOL_TOGETHER_PRIZE_INFO,
        payload: {
          symbol: 'DAI',
          updatedPoolStats: {},
        },
      }];

      const state = actions.reduce(reducer, undefined);
      expect(state).toMatchObject({
        poolStatsGraphQueryFailed: {
          DAI: false,
        },
      });
    });

    it('keeps fetching and query status during rehydration', () => {
      const initialState = reducer(undefined, { type: '', payload: null });

      const action = {
        type: REHYDRATE,
        payload: {
          poolTogether: {
            isFetchingPoolStats: true,
            poolStatsGraphQueryFailed: { DAI: true },
          },
        },
      };

      const poolStatsStatus = {
        isFetchingPoolStats: false,
        poolStatsGraphQueryFailed: { DAI: false },
      };

      const state = reducer({ ...initialState, ...poolStatsStatus }, action);
      expect(state).toMatchObject(poolStatsStatus);
    });
  });
});
