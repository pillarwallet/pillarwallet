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

// actions
import { sendAssetAction, fetchAssetsBalancesAction, getSupportedTokens } from 'actions/assetsActions';

// constants
import {
  UPDATE_ASSET,
  UPDATE_ASSETS_STATE,
  FETCHED,
  FETCHING,
  ETH,
  PLR,
  ASSET_CATEGORY,
} from 'constants/assetsConstants';
import {
  SET_ACCOUNT_ASSETS_BALANCES,
  SET_FETCHING_ASSETS_BALANCES,
} from 'constants/assetsBalancesConstants';
import { INITIAL_REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { CHAIN } from 'constants/chainConstants';

// services
import etherspotService from 'services/etherspot';

// utils
import { mockSupportedAssets } from 'testUtils/jestSetup';

// types
import type { Assets, AssetsByAccount } from 'models/Asset';


const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

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
    iconUrl: '',
    iconMonoUrl: '',
    decimals: 18,
  },
};

const mockAssets: AssetsByAccount = {
  '0x9c': mockAssetsByAccount,
};

const mockFullAssetsListByAccount: Assets = {
  ETH: {
    symbol: ETH,
    name: 'ethereum',
    balance: 1,
    address: '',
    iconUrl: '',
    iconMonoUrl: '',
    decimals: 18,
  },
  PLR: {
    symbol: PLR,
    name: 'ethereum',
    balance: 1,
    address: '',
    iconUrl: '',
    iconMonoUrl: '',
    decimals: 18,
  },
};

const mockEthBalance = { balance: '0.000000000000000001', symbol: 'ETH' };

jest.spyOn(etherspotService, 'getBalances').mockImplementation(() => [mockEthBalance]);

Object.defineProperty(mockWallet, 'sendTransaction', {
  value: () => Promise.resolve('trx_hash'),
});

const initialState = {
  assets: { data: mockAssets, supportedAssets: [] },
  txCount: { data: { lastCount: 0, lastNonce: 0 } },
  history: { data: {} },
  wallet: { data: { address: mockWallet.address } },
  accounts: { data: mockAccounts },
  assetsBalances: { data: {} },
  featureFlags: { data: INITIAL_REMOTE_CONFIG },
  rates: { data: {} },
  appSettings: { data: {} },
  totalBalances: { data: {} },
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
    const updateBalancesPayload = {
      accountId: mockAccounts[0].id,
      chain: CHAIN.ETHEREUM,
      category: ASSET_CATEGORY.WALLET,
      balances: { ETH: mockEthBalance },
    };
    const expectedActions = [
      { type: SET_FETCHING_ASSETS_BALANCES, payload: true },
      { type: SET_ACCOUNT_ASSETS_BALANCES, payload: updateBalancesPayload },
      { type: SET_FETCHING_ASSETS_BALANCES, payload: false },
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
