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
import { fetchAssetsBalancesAction } from 'actions/assetsActions';

// constants
import { ASSET_CATEGORY, SET_CHAIN_SUPPORTED_ASSETS } from 'constants/assetsConstants';
import { SET_ACCOUNT_ASSETS_BALANCES, SET_FETCHING_ASSETS_BALANCES } from 'constants/assetsBalancesConstants';
import { INITIAL_REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { CHAIN } from 'constants/chainConstants';

// services
import etherspotService from 'services/etherspot';

// test utils
import { mockEthAddress, mockPlrAddress, mockSupportedAssets } from 'testUtils/jestSetup';

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

const mockAccounts: Object[] = [
  {
    id: '0x9c',
    address: '0x9c',
    isActive: true,
  },
];

const mockEthBalance = { balance: '0.000000000000000001', symbol: 'ETH', address: mockEthAddress };

const mockPlrBalance = { balance: '1', symbol: 'PLR', address: mockPlrAddress };

const mockAccountsBalances = {
  [mockAccounts[0].id]: {
    ethereum: {
      wallet: {
        [mockEthAddress]: mockEthBalance,
        [mockPlrAddress]: mockPlrBalance,
      },
    },
  },
};

jest.spyOn(etherspotService, 'getBalances').mockImplementation(() => [mockEthBalance]);

Object.defineProperty(mockWallet, 'sendTransaction', {
  value: () => Promise.resolve('trx_hash'),
});

const initialState = {
  assets: { supportedAssets: { ethereum: mockSupportedAssets } },
  txCount: { data: { lastCount: 0, lastNonce: 0 } },
  history: { data: {} },
  wallet: { data: { address: mockWallet.address } },
  accounts: { data: mockAccounts },
  assetsBalances: { data: mockAccountsBalances },
  featureFlags: { data: INITIAL_REMOTE_CONFIG },
  appSettings: { data: {} },
  totalBalances: { data: {} },
  session: { data: { isOnline: true } },
};

describe('Assets actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore(initialState);
  });

  it('should expect series of actions with payload to be dispatch on fetchAssetsBalancesAction execution', () => {
    const updateBalancesPayload = {
      accountId: mockAccounts[0].id,
      chain: CHAIN.ETHEREUM,
      category: ASSET_CATEGORY.WALLET,
      balances: { [mockEthAddress]: mockEthBalance },
    };

    const supportedAssetsPayload = {
      chain: CHAIN.ETHEREUM,
      assets: mockSupportedAssets,
    };

    const expectedActions = [
      { type: SET_FETCHING_ASSETS_BALANCES, payload: true },
      { type: SET_FETCHING_ASSETS_BALANCES, payload: false },
      { type: SET_CHAIN_SUPPORTED_ASSETS, payload: supportedAssetsPayload },
      { type: SET_ACCOUNT_ASSETS_BALANCES, payload: updateBalancesPayload },
    ];

    return store.dispatch(fetchAssetsBalancesAction()).then(() => {
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });
  });
});
