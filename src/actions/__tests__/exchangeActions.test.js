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
  addWbtcPendingTxAction,
  setWbtcPendingTxsAction,
  updatePendingWbtcTransactionsAction,
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
  ADD_WBTC_PENDING_TRANSACTION,
  SET_WBTC_PENDING_TRANSACTIONS,
} from 'constants/exchangeConstants';
import { fetchUniswapSupportedTokens } from 'services/uniswap';
import { mockSupportedAssets } from 'testUtils/jestSetup';
import { fetch1inchSupportedTokens } from 'services/1inch';

const { FETCHING, SUCCESS, ERROR } = UNISWAP_TOKENS_QUERY_STATUS;

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

const hour = 3600000;
const pending = [
  { amount: 1, dateCreated: Date.now() - hour },
  { amount: 3, dateCreated: Date.now() - (hour * 13) },
  { amount: 5, dateCreated: 6 },
];
const ACC_ID = 'id';

// too long for JS number to handle, enforces string/BigNumber
const OFFER_AMOUNT = '1000000.000000000000000001';

const storeState = {
  exchange: {
    data: { offers: [], pendingWbtcTransactions: [pending[0], pending[1]] },
    exchangeSupportedAssets: [
      { symbol: 'ETH', isSynthetixAsset: false },
      { symbol: 'sUSD', isSynthetixAsset: true },
      { symbol: 'sETH', isSynthetixAsset: true },
    ],
  },
  history: { data: { [ACC_ID]: [] } },
  accounts: { data: [{ id: 'id', walletId: 'walletId', type: ACCOUNT_TYPES.SMART_WALLET }] },
};

const getSearchRequestAction = (fromAssetCode: string, toAssetCode: string, fromAmount: string) => ({
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
      await store.dispatch(searchOffersAction('sETH', 'sUSD', OFFER_AMOUNT));
      const actions = store.getActions();
      const expectedActions =
        [getSearchRequestAction('sETH', 'sUSD', OFFER_AMOUNT), getAddOfferAction(PROVIDER_SYNTHETIX)];
      expect(actions).toEqual(expectedActions);
    });
    it('Creates Uniswap and 1inch offers when needed', async () => {
      await store.dispatch(searchOffersAction('ETH', 'sUSD', OFFER_AMOUNT));
      const actions = store.getActions();
      const expectedActions = [
        getSearchRequestAction('ETH', 'sUSD', OFFER_AMOUNT),
        getAddOfferAction(PROVIDER_1INCH),
        getAddOfferAction(PROVIDER_UNISWAP),
      ];
      expect(actions).toEqual(expectedActions);
    });
    it('Does not create offers for invalid data', async () => {
      await store.dispatch(searchOffersAction('invalidToken', 'sUSD', OFFER_AMOUNT));
      const actions = store.getActions();
      const expectedActions = [getSearchRequestAction('invalidToken', 'sUSD', OFFER_AMOUNT)];
      expect(actions).toEqual(expectedActions);
    });
  });
  describe('Taking offers', () => {
    beforeEach(() => {
      store = mockStore(storeState);
    });
    const commonArgs = [mockSupportedAssets[1], OFFER_AMOUNT, PROVIDER_UNISWAP, 'trackId', '123'];
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
      const expectedActions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: SUCCESS },
      }, {
        type: SET_EXCHANGE_SUPPORTED_ASSETS,
        payload: [{ symbol: 'ETH' }],
      }];

      await store.dispatch(getExchangeSupportedAssetsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('updates exchange supported assets even if Uniswap call fails', async () => {
      (fetch1inchSupportedTokens: any).mockImplementationOnce(() => Promise.resolve(['PLR']));
      (fetchUniswapSupportedTokens: any).mockImplementationOnce(() => Promise.resolve(null));

      const expectedActions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: ERROR },
      },
      {
        type: SET_EXCHANGE_SUPPORTED_ASSETS,
        payload: [{ symbol: 'PLR' }],
      }];
      await store.dispatch(getExchangeSupportedAssetsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('updates exchange supported assets even if 1inch call fails', async () => {
      (fetch1inchSupportedTokens: any).mockImplementationOnce(() => Promise.resolve(null));

      const expectedActions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: SUCCESS },
      },
      {
        type: SET_EXCHANGE_SUPPORTED_ASSETS,
        payload: [{ symbol: 'ETH' }],
      }];
      await store.dispatch(getExchangeSupportedAssetsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('does not update supported assets if a service call fails but store has valid supported assets', async () => {
      store = mockStore({
        exchange: { exchangeSupportedAssets: [{ symbol: 'DAI' }] },
        assets: { supportedAssets: [{ symbol: 'ETH' }, { symbol: 'PLR' }] },
      });
      (fetchUniswapSupportedTokens: any).mockImplementationOnce(() => Promise.resolve(null));
      const expectedActions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: ERROR },
      }];
      await store.dispatch(getExchangeSupportedAssetsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('updates query status in case of an error', async () => {
      (fetchUniswapSupportedTokens: any).mockImplementationOnce(() => Promise.resolve(null));

      const expectedActions = [{
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: FETCHING },
      }, {
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: ERROR },
      }];

      await store.dispatch(getExchangeSupportedAssetsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('WBTC.Cafe tests', () => {
    beforeEach(() => {
      store = mockStore(storeState);
    });
    it('adds pending WBTC txs', () => {
      const expectedActions = [{ type: ADD_WBTC_PENDING_TRANSACTION, payload: pending[2] }];
      store.dispatch(addWbtcPendingTxAction(pending[2]));
      expect(store.getActions()).toEqual(expectedActions);
    });
    it('sets pending txs', () => {
      const expectedActions = [{ type: SET_WBTC_PENDING_TRANSACTIONS, payload: [pending[2]] }];
      store.dispatch(setWbtcPendingTxsAction([pending[2]]));
      expect(store.getActions()).toEqual(expectedActions);
    });
    it('correctly updates pending transactions', () => {
      const expectedActions = [{ type: SET_WBTC_PENDING_TRANSACTIONS, payload: [pending[0]] }];
      store.dispatch(updatePendingWbtcTransactionsAction());
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
