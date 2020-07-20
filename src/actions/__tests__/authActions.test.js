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
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  DECRYPTING,
  UPDATE_PIN_ATTEMPTS,
} from 'constants/walletConstants';
import { UPDATE_USER, PENDING, REGISTERED, SET_USERNAME } from 'constants/userConstants';
import { SET_FEATURE_FLAGS } from 'constants/featureFlagsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import Storage from 'services/storage';
import PillarSdk from 'services/api';
import { loginAction } from 'actions/authActions';

const pillarSdk = new PillarSdk();
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const mockWallet: Object = {
  address: '0x9c',
};

const mockUser: Object = {
  username: 'Jon',
};

const registeredMockUser: Object = {
  username: 'JonR',
  walletId: 'walletIdUnique',
};

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
      accounts: { data: [] },
      featureFlags: { data: {} },
      appSettings: { data: {} },
      session: { data: { isOnline: true } },
      smartWallet: {},
    });
  });

  it('should expect series of actions with payload to be dispatch on checkPinAction execution', () => {
    const expectedActions = [
      { type: UPDATE_WALLET_STATE, payload: DECRYPTING },
      { type: SET_USERNAME, payload: mockUser.username },
      { type: UPDATE_PIN_ATTEMPTS, payload: { lastPinAttempt: 0, pinAttemptsCount: 0 } },
      { type: UPDATE_USER, payload: { user: mockUser, state: PENDING } },
      {
        type: DECRYPT_WALLET,
        payload: {
          ...mockWallet,
          privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
        },
      },
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
    storage.save('user', { user: registeredMockUser });
    const expectedActions = [
      { type: UPDATE_WALLET_STATE, payload: DECRYPTING },
      { type: SET_USERNAME, payload: registeredMockUser.username },
      { type: SET_FEATURE_FLAGS, payload: {} },
      { type: UPDATE_PIN_ATTEMPTS, payload: { lastPinAttempt: 0, pinAttemptsCount: 0 } },
      { type: UPDATE_USER, payload: { user: registeredMockUser, state: REGISTERED } },
      { type: DECRYPT_WALLET, payload: { ...mockWallet, privateKey: undefined } },
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
