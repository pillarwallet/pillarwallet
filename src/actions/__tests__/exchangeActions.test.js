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

import isEmpty from 'lodash.isempty';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import {
  searchOffersAction,
  takeOfferAction,
  getExchangeSupportedAssetsAction,
} from 'actions/exchangeActions';
import {
  SET_EXCHANGE_SEARCH_REQUEST,
  ADD_OFFER,
  PROVIDER_SYNTHETIX,
  PROVIDER_UNISWAP,
  PROVIDER_1INCH,
  SET_UNISWAP_TOKENS_QUERY_STATUS,
  UNISWAP_TOKENS_QUERY_STATUS,
  SET_EXCHANGE_SUPPORTED_ASSETS,
} from 'constants/exchangeConstants';
import { fetchUniswapSupportedTokens } from 'services/uniswap';
import { GraphQueryError } from 'services/theGraph';
import { mockSupportedAssets } from 'testUtils/jestSetup';

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

const storeState = {
  exchange: {
    data: { offers: [] },
    exchangeSupportedAssets: [
      { symbol: 'ETH', isSynthetixAsset: false },
      { symbol: 'sUSD', isSynthetixAsset: true },
      { symbol: 'sETH', isSynthetixAsset: true },
    ],
  },
  accounts: { data: [{ id: 'id', walletId: 'walletId', type: ACCOUNT_TYPES.SMART_WALLET }] },
};

const getSearchRequestAction = (fromAssetCode: string, toAssetCode: string, fromAmount: number) => ({
  type: SET_EXCHANGE_SEARCH_REQUEST,
  payload: { fromAssetCode, toAssetCode, fromAmount },
});

const getAddOfferAction = (provider: string) => ({
  type: ADD_OFFER,
  payload: { provider },
});

describe('Exchange actions test', () => {
  let store;
  describe('Creating offers', () => {
    beforeEach(() => {
      store = mockStore(storeState);
    });
    it('Creates Synthetix offers when needed', async () => {
      await store.dispatch(searchOffersAction('sETH', 'sUSD', 10));
      const actions = store.getActions();
      const expectedActions = [getSearchRequestAction('sETH', 'sUSD', 10), getAddOfferAction(PROVIDER_SYNTHETIX)];
      expect(actions).toEqual(expectedActions);
    });
    it('Creates Uniswap and 1inch offers when needed', async () => {
      await store.dispatch(searchOffersAction('ETH', 'sUSD', 10));
      const actions = store.getActions();
      const expectedActions = [
        getSearchRequestAction('ETH', 'sUSD', 10),
        getAddOfferAction(PROVIDER_1INCH),
        getAddOfferAction(PROVIDER_UNISWAP),
      ];
      expect(actions).toEqual(expectedActions);
    });
    it('Does not create offers for invalid data', async () => {
      await store.dispatch(searchOffersAction('invalidToken', 'sUSD', 10));
      const actions = store.getActions();
      const expectedActions = [getSearchRequestAction('invalidToken', 'sUSD', 10)];
      expect(actions).toEqual(expectedActions);
    });
  });
  describe('Taking offers', () => {
    beforeEach(() => {
      store = mockStore(storeState);
    });
    const commonArgs = [mockSupportedAssets[1], 10, PROVIDER_UNISWAP, 'trackId'];
    it('Creates an exchange transaction object for valid data', async () => {
      let txData;
      await store.dispatch(takeOfferAction(mockSupportedAssets[0], ...commonArgs, (val) => { txData = val; }));
      expect(isEmpty(txData)).toBeFalsy();
    });
    it('Does not create an exchange transaction object for invalid data', async () => {
      let txData;
      // $FlowFixMe
      await store.dispatch(takeOfferAction(null, ...commonArgs, (val) => { txData = val; }));
      expect(isEmpty(txData)).toBeTruthy();
    });
  });

  describe('Uniswap supported assets subgraph query', () => {
    beforeEach(() => {
      store = mockStore({
        exchange: {
          exchangeSupportedAssets: [],
          uniswapTokensGraphQueryFailed: false,
          isFetchingUniswapTokens: false,
        },
        assets: {
          supportedAssets: [
            { symbol: 'ETH' },
            { symbol: 'PLR' },
          ],
        },
      });
    });

    it('updates query status in case of a successful response', async () => {
      (fetchUniswapSupportedTokens: any).mockImplementationOnce(async () => ['ETH']);

      const expectedActions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.SUCCESS },
      }, {
        type: SET_EXCHANGE_SUPPORTED_ASSETS,
        payload: [{ symbol: 'ETH' }],
      }];

      await store.dispatch(getExchangeSupportedAssetsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('updates query status in case of an error', async () => {
      (fetchUniswapSupportedTokens: any).mockImplementationOnce(() =>
        Promise.reject(new GraphQueryError('subgraph', 'query', new Error())),
      );

      const expectedActions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.ERROR },
      }, {
        type: SET_EXCHANGE_SUPPORTED_ASSETS,
        payload: [],
      }];

      await store.dispatch(getExchangeSupportedAssetsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
