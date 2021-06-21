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

// constants
import { UPDATE_PIN_ATTEMPTS, SET_WALLET_IS_DECRYPTING, SET_WALLET } from 'constants/walletConstants';
import { SET_USER } from 'constants/userConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import {
  SET_ARCHANOVA_WALLET_CONNECTED_ACCOUNT,
  SET_ARCHANOVA_SDK_INIT,
  ARCHANOVA_WALLET_UPGRADE_STATUSES,
} from 'constants/archanovaConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';

// actions
import { loginAction } from 'actions/authActions';

// services
import Storage from 'services/storage';
import etherspotService from 'services/etherspot';

// test utils
import {
  mockEtherspotAccount,
  mockEtherspotApiAccount,
  mockArchanovaAccount,
  mockArchanovaConnectedAccount,
  mockEtherspotAccountExtra,
} from 'testUtils/jestSetup';


jest.spyOn(etherspotService, 'getAccounts').mockImplementation(() => [mockEtherspotApiAccount]);

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

const mockWallet: Object = {
  address: '0x9c',
};

const mockUser: Object = {
  username: 'Jon',
};

const mockNewEtherspotAccount = { ...mockEtherspotAccount, extra: mockEtherspotAccountExtra };
const mockActiveSmartWalletAccount = { ...mockArchanovaAccount, isActive: true };

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
      wallet: {
        backupStatus: { isBackedUp: false, isImported: false },
      },
      connectionKeyPairs: { data: [], lastConnectionKeyIndex: -1 },
      accounts: { data: [mockActiveSmartWalletAccount] },
      featureFlags: { data: {} },
      appSettings: { data: { hasSeenTutorial: true } },
      onboarding: { tutorialData: null },
      session: { data: { isOnline: true } },
      smartWallet: { upgrade: { status: ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE } },
      assetsBalances: { data: {} },
      user: { data: { username: 'test-username' } },
    });
  });

  it('should expect series of actions with payload to be dispatch on loginAction execution', () => {
    const expectedActions = [
      { type: UPDATE_SESSION, payload: { isAuthorizing: true } },
      { type: SET_WALLET_IS_DECRYPTING },
      { type: SET_USER, payload: mockUser },
      { type: SET_WALLET, payload: mockWallet },
      { type: SET_ARCHANOVA_SDK_INIT, payload: true },
      { type: SET_ARCHANOVA_WALLET_CONNECTED_ACCOUNT, payload: mockArchanovaConnectedAccount },
      { type: UPDATE_SESSION, payload: { fcmToken: '12x2342x212' } },

      // appends new Etherspot account to reducer
      { type: UPDATE_ACCOUNTS, payload: [mockActiveSmartWalletAccount, mockNewEtherspotAccount] },

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
});
