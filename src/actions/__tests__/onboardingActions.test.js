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

// actions
import { beginOnboardingAction, setupWalletAction } from 'actions/onboardingActions';

// utils
import { transformAssetsToObject } from 'utils/assets';

// services
import PillarSdk from 'services/api';

// other
import { initialAssets as mockInitialAssets } from 'fixtures/assets';

// test utils
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
      wallet: { data: { privateKey: '' } }, // redux mock is not setting into state, it's set based on previous test
    });
    const expectedActions = [
      { type: SET_WALLET, payload: mockWallet },
      { type: UPDATE_WALLET_BACKUP_STATUS, payload: mockBackupStatus },
      { type: SET_WALLET_IS_ENCRYPTING, payload: true },
      { type: SET_WALLET_IS_ENCRYPTING, payload: false },
      // { type: UPDATE_ACCOUNTS, payload: [] },
      // { type: UPDATE_ASSETS, payload: {} },
      // { type: RESET_APP_SETTINGS, payload: {} },
      // { type: SET_HISTORY, payload: {} },
      // { type: UPDATE_BALANCES, payload: {} },
      // { type: UPDATE_COLLECTIBLES, payload: {} },
      // { type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: {} },
      // { type: UPDATE_BADGES, payload: [] },
      // { type: RESET_SMART_WALLET },
      // { type: RESET_PAYMENT_NETWORK },
      // { type: SET_USER_SETTINGS, payload: {} },
      // { type: SET_USER_EVENTS, payload: [] },
      // { type: UPDATE_WALLET_STATE, payload: GENERATING },
      // { type: UPDATE_WALLET_STATE, payload: ENCRYPTING },
      // { type: SET_WALLET, payload: mockWallet },
      // { type: UPDATE_WALLET_STATE, payload: REGISTERING },
      // { type: UPDATE_SESSION, payload: { fcmToken: '12x2342x212' } },
      // { type: SET_USER, payload: { state: REGISTERED, user: { username: 'snow', walletId: 2 } } },
      // { type: SET_SMART_WALLET_SDK_INIT, payload: true },
      // { type: SET_SMART_WALLET_ACCOUNTS, payload: [mockSmartWalletAccountApiData] },
      // { type: UPDATE_ACCOUNTS, payload: [mockSmartWalletAccount] },
      // { type: SET_CONNECTED_DEVICES, payload: [] },
      // { type: SET_SMART_WALLET_CONNECTED_ACCOUNT, payload: mockSmartWalletConnectedAccount },
      // { type: UPDATE_ACCOUNTS, payload: [{ ...mockSmartWalletAccount, isActive: true }] },
      // { type: SET_SMART_WALLET_UPGRADE_STATUS, payload: SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED },
      // {
      //   type: SET_INITIAL_ASSETS,
      //   payload: {
      //     accountId: mockSmartWalletAccount.id,
      //     assets: transformAssetsToObject(mockInitialAssets),
      //   },
      // },
      // { type: UPDATE_WALLET_STATE, payload: DECRYPTED },
    ];

    return store.dispatch(beginOnboardingAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be
  dispatch on setupWalletAction execution when wallet was imported`, () => {
    store = mockStore({
      session: { data: { isOnline: true } },
      onboarding: {
        ...mockOnboarding,
        wallet: mockImportedWallet,
      },
      wallet: {
        backupStatus: mockBackupStatus,
      },
    });
    const expectedActions = [
      { type: UPDATE_WALLET_BACKUP_STATUS, payload: { ...mockBackupStatus, isBackedUp: true, isImported: true } },
      { type: SET_WALLET_IS_ENCRYPTING, payload: true },
      { type: SET_WALLET_IS_ENCRYPTING, payload: false },
      // { type: UPDATE_ASSETS, payload: {} },
      // { type: RESET_APP_SETTINGS, payload: {} },
      // { type: SET_HISTORY, payload: {} },
      // { type: UPDATE_BALANCES, payload: {} },
      // { type: UPDATE_COLLECTIBLES, payload: {} },
      // { type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: {} },
      // { type: UPDATE_BADGES, payload: [] },
      // { type: RESET_SMART_WALLET },
      // { type: RESET_PAYMENT_NETWORK },
      // { type: SET_USER_SETTINGS, payload: {} },
      // { type: SET_USER_EVENTS, payload: [] },
      // { type: UPDATE_WALLET_STATE, payload: ENCRYPTING },
      // { type: SET_WALLET, payload: mockWallet },
      // { type: UPDATE_WALLET_STATE, payload: REGISTERING },
      // { type: UPDATE_SESSION, payload: { fcmToken: '12x2342x212' } },
      // { type: SET_USER, payload: { state: REGISTERED, user: { username: 'snow', walletId: 2 } } },
      // { type: SET_SMART_WALLET_SDK_INIT, payload: true },
      // { type: SET_SMART_WALLET_ACCOUNTS, payload: [mockSmartWalletAccountApiData] },
      // { type: UPDATE_ACCOUNTS, payload: [mockSmartWalletAccount] },
      // { type: SET_CONNECTED_DEVICES, payload: [] },
      // { type: SET_SMART_WALLET_CONNECTED_ACCOUNT, payload: mockSmartWalletConnectedAccount },
      // { type: UPDATE_ACCOUNTS, payload: [{ ...mockSmartWalletAccount, isActive: true }] },
      // { type: SET_SMART_WALLET_UPGRADE_STATUS, payload: SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED },
      // {
      //   type: SET_INITIAL_ASSETS,
      //   payload: {
      //     accountId: mockSmartWalletAccount.id,
      //     assets: transformAssetsToObject(mockInitialAssets),
      //   },
      // },
      // { type: UPDATE_WALLET_STATE, payload: DECRYPTED },
    ];

    return store.dispatch(setupWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
