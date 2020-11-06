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
  SET_UNISWAP_TOKENS_QUERY_STATUS,
  UNISWAP_TOKENS_QUERY_STATUS,
} from 'constants/exchangeConstants';
import reducer from 'reducers/exchangeReducer';

describe('Exchange reducer', () => {
  describe('handles uniswap supported tokens subgraph query status', () => {
    it('marks start of the request', () => {
      const action = {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING },
      };

      const state = reducer(undefined, action);
      expect(state).toMatchObject({ isFetchingUniswapTokens: true });
    });

    it('resets fetching and failure flags on success', () => {
      const actions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.SUCCESS },
      }];

      const state = actions.reduce(reducer, undefined);
      expect(state).toMatchObject({
        isFetchingUniswapTokens: false,
        uniswapTokensGraphQueryFailed: false,
      });
    });

    it('marks query error when it occurs', () => {
      const actions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.ERROR },
      }];

      const state = actions.reduce(reducer, undefined);
      expect(state).toMatchObject({
        isFetchingUniswapTokens: false,
        uniswapTokensGraphQueryFailed: true,
      });
    });
  });
});
