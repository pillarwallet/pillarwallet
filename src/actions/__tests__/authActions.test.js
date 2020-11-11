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
import merge from 'lodash.merge';

// constants
import { UPDATE_PIN_ATTEMPTS, SET_WALLET_IS_DECRYPTING, SET_WALLET } from 'constants/walletConstants';
import { UPDATE_USER, SET_USER } from 'constants/userConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import {
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  SET_SMART_WALLET_SDK_INIT,
  SMART_WALLET_UPGRADE_STATUSES,
} from 'constants/smartWalletConstants';
import { SET_CONNECTED_DEVICES } from 'constants/connectedDevicesConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import {
  SET_UNISWAP_TOKENS_QUERY_STATUS,
  UNISWAP_TOKENS_QUERY_STATUS,
} from 'constants/exchangeConstants';

// actions
import { loginAction } from 'actions/authActions';

// services
import Storage from 'services/storage';
import PillarSdk from 'services/api';


// test utils
import { mockSmartWalletAccount, mockSmartWalletConnectedAccount } from 'testUtils/jestSetup';


const mockUpdatedUser = {
  username: 'John Appleseed',
  walletId: 'walletIdUnique',
};

jest.mock('services/api', () => jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  setUsername: jest.fn(),
  userInfo: jest.fn(() => mockUpdatedUser),
})));

const pillarSdk = new PillarSdk();
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const mockWallet: Object = {
  address: '0x9c',
};

const mockUser: Object = {
  username: 'Jon',
};

const mockRegisteredUser: Object = {
  username: 'JonR',
  walletId: 'walletIdUnique',
};

pillarSdk.userInfo.mockResolvedValue(mockUpdatedUser);

Object.defineProperty(mockWallet, 'encrypt', {
  value: () => Promise.resolve({ address: 'encry_pted' }),
});

describe('Auth actions', () => {
  let store;

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    storage.save('user', { user: mockUser });
    return storage.save('wallet', { wallet: mockWallet });
  });

  beforeEach(() => {
    store = mockStore({
      assets: { data: {} },
      navigation: {},
      oAuthTokens: { data: {} },
      wallet: {
        backupStatus: { isBackedUp: false, isImported: false },
      },
      connectionKeyPairs: { data: [], lastConnectionKeyIndex: -1 },
      accounts: { data: [{ ...mockSmartWalletAccount, isActive: true }] },
      featureFlags: { data: {} },
      appSettings: { data: {} },
      session: { data: { isOnline: true } },
      smartWallet: { upgrade: { status: SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE } },
      balances: { data: {} },
      user: { data: {} },
    });
  });

  it('should expect series of actions with payload to be dispatch on checkPinAction execution', () => {
    const expectedActions = [
      { type: UPDATE_SESSION, payload: { isAuthorizing: true } },
      { type: SET_WALLET_IS_DECRYPTING },
      { type: SET_USER, payload: mockUser },
      {
        type: SET_WALLET,
        payload: {
          ...mockWallet,
          privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
        },
      },
      { type: SET_SMART_WALLET_SDK_INIT, payload: true },
      { type: SET_CONNECTED_DEVICES, payload: [] },
      { type: SET_SMART_WALLET_CONNECTED_ACCOUNT, payload: mockSmartWalletConnectedAccount },
      { type: SET_UNISWAP_TOKENS_QUERY_STATUS, payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING } },
      { type: UPDATE_PIN_ATTEMPTS, payload: { lastPinAttempt: 0, pinAttemptsCount: 0 } },
      { type: UPDATE_APP_SETTINGS, payload: { initialDeeplinkExecuted: true } },
      { type: UPDATE_SESSION, payload: { isAuthorizing: false } },
    ];

    const pin = '123456';

    return store.dispatch(loginAction(pin))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should expect a different set of actions for registered users.', async () => {
    const storage = Storage.getInstance('db');
    storage.save('user', { user: mockRegisteredUser });
    const expectedActions = [
      { type: UPDATE_SESSION, payload: { isAuthorizing: true } },
      { type: SET_WALLET_IS_DECRYPTING },
      { type: SET_USER, payload: mockRegisteredUser },
      { type: SET_WALLET, payload: mockWallet },
      { type: SET_SMART_WALLET_SDK_INIT, payload: true },
      { type: SET_CONNECTED_DEVICES, payload: [] },
      { type: SET_SMART_WALLET_CONNECTED_ACCOUNT, payload: mockSmartWalletConnectedAccount },
      { type: SET_UNISWAP_TOKENS_QUERY_STATUS, payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING } },
      { type: UPDATE_USER, payload: merge({}, mockRegisteredUser, mockUpdatedUser) },
      { type: UPDATE_PIN_ATTEMPTS, payload: { lastPinAttempt: 0, pinAttemptsCount: 0 } },
      { type: UPDATE_APP_SETTINGS, payload: { initialDeeplinkExecuted: true } },
      { type: UPDATE_SESSION, payload: { isAuthorizing: false } },
      { type: UPDATE_SESSION, payload: { fcmToken: '12x2342x212' } },
    ];

    const pin = '123456';
    return store.dispatch(loginAction(pin))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
