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
import { WebSocket } from 'mock-socket';

// constants
import { SET_WALLET, UPDATE_WALLET_BACKUP_STATUS, SET_WALLET_IS_ENCRYPTING } from 'constants/walletConstants';
import { SET_REGISTERING_USER } from 'constants/onboardingConstants';
import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { SET_USER } from 'constants/userConstants';
import { SET_SMART_WALLET_ACCOUNTS, SET_SMART_WALLET_SDK_INIT } from 'constants/smartWalletConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import {
  DEFAULT_ACCOUNTS_ASSETS_DATA_KEY,
  SET_INITIAL_ASSETS,
  UPDATE_ASSETS,
  UPDATE_SUPPORTED_ASSETS,
} from 'constants/assetsConstants';
import { SET_HISTORY } from 'constants/historyConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { UPDATE_BADGES } from 'constants/badgesConstants';

// actions
import {
  setupAppServicesAction,
  setupUserAction,
  setupWalletAction,
} from 'actions/onboardingActions';

// utils
import { transformAssetsToObject } from 'utils/assets';

// services
import PillarSdk from 'services/api';

// other
import { initialAssets as mockInitialAssets } from 'fixtures/assets';

// test utils
import {
  mockExchangeRates,
  mockSmartWalletAccount,
  mockSmartWalletAccountApiData,
  mockSmartWalletConnectedAccount,
  mockSupportedAssets,
  mockUserBadges,
} from 'testUtils/jestSetup';

// types
import type { EthereumWallet } from 'models/Wallet';


global.WebSocket = WebSocket;

const mockUser = { username: 'snow', walletId: 2 };

const mockFetchInitialAssetsResponse = transformAssetsToObject(mockInitialAssets);

jest.mock('services/api', () => jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  setUsername: jest.fn(),
  fetchAccessTokens: jest.fn(),
  fetchNotifications: jest.fn(),
  listAccounts: jest.fn(),
  registerOnAuthServer: jest.fn(() => ({
    userId: 1,
    walletId: 2,
    refreshToken: 'uniqueRefreshToken',
    accessToken: 'uniqueAccessToken',
  })),
  updateUser: jest.fn(() => mockUser),
  userInfo: jest.fn(() => mockUser),
  fetchInitialAssets: jest.fn(() => mockFetchInitialAssetsResponse),
  fetchSupportedAssets: jest.fn(() => mockSupportedAssets),
  fetchBadges: jest.fn(() => mockUserBadges),
})));

const pillarSdk = new PillarSdk();

const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const mockWallet: EthereumWallet = {
  address: '0x9c',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
  mnemonic: undefined,
};

const mockImportedWallet: EthereumWallet = {
  address: '0x9c',
  mnemonic: 'ecology any source blush mechanic drama latin special bind moon token step',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
};

const mockOnboarding: Object = {
  wallet: null,
  pinCode: '123456',
  user: { username: mockUser.username },
};

const mockBackupStatus: Object = {
  isImported: false,
  isBackedUp: false,
  isRecoveryPending: false,
};

const mockOauthTokens: Object = {
  accessToken: 'uniqueAccessToken',
  refreshToken: 'uniqueRefreshToken',
};

const mockFcmToken = '12x2342x212';

describe('Onboarding actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore({});
  });

  it(`should expect series of actions with payload to be dispatched
  on setupWalletAction execution when wallet wasn't imported`, () => {
    store = mockStore({
      session: { data: { isOnline: true } },
      onboarding: mockOnboarding,
    });

    const expectedActions = [
      { type: SET_WALLET, payload: mockWallet },
      { type: UPDATE_WALLET_BACKUP_STATUS, payload: mockBackupStatus },
      { type: SET_WALLET_IS_ENCRYPTING, payload: true },
      { type: SET_WALLET_IS_ENCRYPTING, payload: false },
    ];

    return store.dispatch(setupWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be
  dispatched on setupWalletAction execution when wallet was imported`, () => {
    store = mockStore({
      session: { data: { isOnline: true } },
      onboarding: {
        ...mockOnboarding,
        wallet: mockImportedWallet,
      },
    });

    const expectedActions = [
      { type: SET_WALLET, payload: mockWallet },
      { type: UPDATE_WALLET_BACKUP_STATUS, payload: { ...mockBackupStatus, isBackedUp: true, isImported: true } },
      { type: SET_WALLET_IS_ENCRYPTING, payload: true },
      { type: SET_WALLET_IS_ENCRYPTING, payload: false },
    ];

    return store.dispatch(setupWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be
  dispatched on setupUserAction execution when network is online`, () => {
    store = mockStore({
      session: { data: { isOnline: true } },
      wallet: {
        backupStatus: mockBackupStatus,
        data: mockImportedWallet,
      },
    });

    const expectedActions = [
      { type: SET_REGISTERING_USER, payload: true },
      { type: UPDATE_OAUTH_TOKENS, payload: mockOauthTokens },
      { type: UPDATE_SESSION, payload: { fcmToken: mockFcmToken } },
      { type: SET_USER, payload: mockUser },
      { type: SET_REGISTERING_USER, payload: false },
    ];

    return store.dispatch(setupUserAction(mockUser.username))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be
  dispatched on setupUserAction execution when network is offline`, () => {
    store = mockStore({
      session: { data: { isOnline: false } },
      wallet: {
        backupStatus: mockBackupStatus,
        data: mockImportedWallet,
      },
    });

    const expectedActions = [
      { type: SET_REGISTERING_USER, payload: true },
      { type: SET_USER, payload: { username: mockUser.username } },
      { type: SET_REGISTERING_USER, payload: false },
    ];

    return store.dispatch(setupUserAction(mockUser.username))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be
  dispatched on setupAppServicesAction execution when network is online`, () => {
    store = mockStore({
      session: { data: { isOnline: true } },
      wallet: {
        backupStatus: mockBackupStatus,
        data: mockImportedWallet,
      },
      user: { data: mockUser },
      accounts: { data: [mockSmartWalletAccount] },
      smartWallet: { connectedAccount: mockSmartWalletConnectedAccount },
      assets: {
        supportedAssets: [],
        data: { [mockSmartWalletAccount.id]: transformAssetsToObject(mockInitialAssets) },
      },
      history: { data: {} },
      balances: { data: {} },
      rates: { data: {} },
      badges: { data: [] },
    });

    const expectedActions = [
      {
        type: UPDATE_ASSETS,
        payload: { [DEFAULT_ACCOUNTS_ASSETS_DATA_KEY]: transformAssetsToObject(mockInitialAssets) },
      },
      { type: UPDATE_RATES, payload: mockExchangeRates },
      { type: UPDATE_BADGES, payload: mockUserBadges.map((badge) => ({ ...badge, balance: 1 })) },
      { type: SET_SMART_WALLET_SDK_INIT, payload: true },
      { type: SET_SMART_WALLET_ACCOUNTS, payload: [mockSmartWalletAccountApiData] },
      { type: UPDATE_ACCOUNTS, payload: [{ ...mockSmartWalletAccount, extra: mockSmartWalletAccountApiData }] },
      {
        type: SET_INITIAL_ASSETS,
        payload: {
          accountId: mockSmartWalletAccount.id,
          assets: transformAssetsToObject(mockInitialAssets),
        },
      },
      { type: UPDATE_SUPPORTED_ASSETS, payload: mockSupportedAssets },
      { type: SET_HISTORY, payload: { [mockSmartWalletAccount.id]: [] } },
    ];

    return store.dispatch(setupAppServicesAction('0xprivateKey'))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be
  dispatched on setupAppServicesAction execution when network is offline`, () => {
    store = mockStore({
      session: { data: { isOnline: false } },
      wallet: {
        backupStatus: mockBackupStatus,
        data: mockImportedWallet,
      },
      user: { data: mockUser },
    });

    const expectedActions = [
      {
        type: UPDATE_ASSETS,
        payload: { [DEFAULT_ACCOUNTS_ASSETS_DATA_KEY]: transformAssetsToObject(mockInitialAssets) },
      },
    ];

    return store.dispatch(setupAppServicesAction('0xprivateKey'))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
