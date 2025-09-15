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
import { SET_WALLET, UPDATE_WALLET_BACKUP_STATUS, SET_WALLET_IS_ENCRYPTING } from 'constants/walletConstants';
import { SET_ONBOARDING_USERNAME_REGISTRATION_FAILED, SET_REGISTERING_USER } from 'constants/onboardingConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { SET_USER } from 'constants/userConstants';
import { SET_CHAIN_SUPPORTED_ASSETS } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { setupAppServicesAction, setupUserAction, setupWalletAction } from 'actions/onboardingActions';
import { localAssets } from 'actions/assetsActions';

// services
import etherspotService from 'services/etherspot';
import { firebaseAnalytics } from 'services/firebase';

// test utils
import { mockEtherspotApiAccount, mockArchanovaAccount, mockDeviceUniqueId } from 'testUtils/jestSetup';

// types
import type { EthereumWallet } from 'models/Wallet';

jest.setTimeout(20000);

const mockUser = { username: 'snow' };

jest.spyOn(etherspotService, 'getAccounts').mockImplementation(() => [mockEtherspotApiAccount]);

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

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
  isNewUser: false,
  isFetching: false,
  loaderMessage: '',
};

const mockBackupStatus: Object = {
  isImported: false,
  isBackedUp: false,
};

const mockFcmToken = '12x2342x212';
const randomPrivateKey = '0x09e910621c2e988e9f7f6ffcd7024f54ec1461fa6e86a4b545e9e1fe21c28866';

describe('Onboarding actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore({});
    firebaseAnalytics.setUserProperties = jest.fn();
  });

  it(`should expect series of actions with payload to be dispatched
  on setupWalletAction execution when wallet wasn't imported`, () => {
    store = mockStore({
      appSettings: { data: { deviceUniqueId: mockDeviceUniqueId } },
      session: { data: { isOnline: true } },
      onboarding: mockOnboarding,
    });

    const expectedActions = [
      { type: SET_WALLET, payload: mockWallet },
      { type: UPDATE_WALLET_BACKUP_STATUS, payload: mockBackupStatus },
      { type: SET_WALLET_IS_ENCRYPTING, payload: true },
      { type: SET_WALLET_IS_ENCRYPTING, payload: false },
    ];

    return store.dispatch(setupWalletAction()).then(() => {
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });
  });

  it(`should expect series of actions with payload to be
  dispatched on setupWalletAction execution when wallet was imported`, () => {
    store = mockStore({
      appSettings: { data: { deviceUniqueId: mockDeviceUniqueId } },
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

    return store.dispatch(setupWalletAction()).then(() => {
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
      onboarding: mockOnboarding,
    });

    const expectedActions = [
      { type: SET_REGISTERING_USER, payload: true },
      { type: SET_ONBOARDING_USERNAME_REGISTRATION_FAILED, payload: false },
      { type: UPDATE_SESSION, payload: { fcmToken: mockFcmToken } },
      { type: SET_USER, payload: mockUser },
      { type: SET_REGISTERING_USER, payload: false },
    ];

    return store.dispatch(setupUserAction(mockUser.username)).then(() => {
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
      onboarding: mockOnboarding,
    });

    const expectedActions = [
      { type: SET_REGISTERING_USER, payload: true },
      { type: SET_ONBOARDING_USERNAME_REGISTRATION_FAILED, payload: false },
      { type: SET_USER, payload: { username: mockUser.username } },
      { type: SET_REGISTERING_USER, payload: false },
    ];

    return store.dispatch(setupUserAction(mockUser.username)).then(() => {
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
      assets: { supportedAssets: { ethereum: localAssets(CHAIN.ETHEREUM) } },
      onboarding: mockOnboarding,
      accounts: { data: [mockArchanovaAccount] },
    });

    const expectedActions = [
      { type: SET_CHAIN_SUPPORTED_ASSETS, payload: { chain: CHAIN.ETHEREUM, assets: localAssets(CHAIN.ETHEREUM) } },
    ];

    return store.dispatch(setupAppServicesAction(randomPrivateKey)).then(() => {
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expect.arrayContaining(expectedActions));
    });
  });
});
