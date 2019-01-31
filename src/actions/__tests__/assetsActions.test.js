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
  UPDATE_ASSET,
  UPDATE_ASSETS_STATE,
  FETCHED,
  FETCHING,
  ETH,
  UPDATE_BALANCES,
} from 'constants/assetsConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import type { Assets } from 'models/Asset';
import PillarSdk from 'services/api';
import { sendAssetAction, fetchAssetsBalancesAction } from '../assetsActions';

const pillarSdk = new PillarSdk();
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const getTransactionCountMock = jest.fn(() => {
  return new Promise((resolve) => {
    resolve(0);
  });
});

const mockWallet: Object = {
  address: '0x9c',
  provider: { getTransactionCount: getTransactionCountMock },
};

const mockTransaction: Object = {
  gasLimit: 2000000,
  amount: 0.5,
  address: '000x124',
  gasPrice: 15000,
  note: 'test note',
};

const mockAssets: Assets = {
  ETH: {
    symbol: ETH,
    name: 'ethereum',
    balance: 1,
    address: '',
    description: '',
    iconUrl: '',
    iconMonoUrl: '',
    wallpaperUrl: '',
    decimals: 18,
  },
};

const mockExchangeRates = {
  ETH: {
    EUR: 624.21,
    GBP: 544.57,
    USD: 748.92,
  },
};

Object.defineProperty(mockWallet, 'sendTransaction', {
  value: () => Promise.resolve('trx_hash'),
});

const initialState = {
  assets: { data: { [ETH]: { balance: 10 } } },
  txCount: { data: { lastCount: 0, lastNonce: 0 } },
  history: { data: [] },
};

describe('Wallet actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore(initialState);
  });

  xit('should expect series of actions with payload to be dispatch on sendAssetAction execution', () => {
    const expectedActions = [
      { type: UPDATE_ASSETS_STATE, payload: FETCHING },
      { type: UPDATE_ASSET, payload: { symbol: ETH, balance: 9.5 } },
      { type: UPDATE_ASSETS_STATE, payload: FETCHED },
    ];

    return store.dispatch(sendAssetAction(mockTransaction, mockWallet))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should expect series of actions with payload to be dispatch on fetchAssetsBalancesAction execution', () => {
    const updateBalancesPayload = { ETH: { balance: 1, symbol: 'ETH' } };
    const expectedActions = [
      { payload: FETCHING, type: UPDATE_ASSETS_STATE },
      { payload: updateBalancesPayload, type: UPDATE_BALANCES },
      { payload: mockExchangeRates, type: UPDATE_RATES },
    ];
    return store.dispatch(fetchAssetsBalancesAction(mockAssets, mockWallet.address))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
