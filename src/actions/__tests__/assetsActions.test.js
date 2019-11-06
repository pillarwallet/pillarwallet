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
  PLR,
  UPDATE_BALANCES,
} from 'constants/assetsConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import type { Assets, AssetsByAccount } from 'models/Asset';
import PillarSdk from 'services/api';
import { sendAssetAction, fetchAssetsBalancesAction, getSupportedTokens } from 'actions/assetsActions';
import { INITIAL_FEATURE_FLAGS } from 'constants/featureFlagsConstants';

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

const mockAccounts: Object[] = [{
  id: '0x9c',
  address: '0x9c',
  isActive: true,
}];

const mockTransaction: Object = {
  gasLimit: 2000000,
  amount: 0.5,
  address: '000x124',
  gasPrice: 15000,
  note: 'test note',
};

const mockAssetsByAccount: Assets = {
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

const mockAssets: AssetsByAccount = {
  '0x9c': mockAssetsByAccount,
};

const mockExchangeRates = {
  ETH: {
    EUR: 624.21,
    GBP: 544.57,
    USD: 748.92,
  },
};

const mockSupportedAssets = [
  {
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
  {
    symbol: PLR,
    name: 'ethereum',
    balance: 1,
    address: '',
    description: '',
    iconUrl: '',
    iconMonoUrl: '',
    wallpaperUrl: '',
    decimals: 18,
  },
];

const mockFullAssetsListByAccount: Assets = {
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
  PLR: {
    symbol: PLR,
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

Object.defineProperty(mockWallet, 'sendTransaction', {
  value: () => Promise.resolve('trx_hash'),
});

const initialState = {
  assets: { data: mockAssets, supportedAssets: [] },
  txCount: { data: { lastCount: 0, lastNonce: 0 } },
  history: { data: {} },
  wallet: { data: { address: mockWallet.address } },
  accounts: { data: mockAccounts },
  balances: { data: {} },
  featureFlags: { data: INITIAL_FEATURE_FLAGS },
};

describe('Assets actions', () => {
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
    const updateBalancesPayload = { [mockAccounts[0].id]: { ETH: { balance: 1, symbol: 'ETH' } } };
    const expectedActions = [
      { payload: FETCHING, type: UPDATE_ASSETS_STATE },
      { payload: updateBalancesPayload, type: UPDATE_BALANCES },
      { payload: mockExchangeRates, type: UPDATE_RATES },
    ];
    return store.dispatch(fetchAssetsBalancesAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should add missing PLR and/or ETH to asset list on checkForMissedAssetsAction execution', () => {
    expect(getSupportedTokens(mockSupportedAssets, mockAssets, mockAccounts[0]))
      .toEqual({ ...mockFullAssetsListByAccount, id: mockAccounts[0].id });
  });
});
