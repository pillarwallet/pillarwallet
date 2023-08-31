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
import {
  SET_ONBOARDING_USERNAME_REGISTRATION_FAILED,
  SET_REGISTERING_USER,
  SET_LOADING_MESSAGE,
} from 'constants/onboardingConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { SET_USER } from 'constants/userConstants';
import {
  SET_ARCHANOVA_WALLET_ACCOUNTS,
  SET_ARCHANOVA_SDK_INIT,
  ARCHANOVA_WALLET_UPGRADE_STATUSES,
} from 'constants/archanovaConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import { ETH, PLR, SET_CHAIN_SUPPORTED_ASSETS, NFT_FLAG } from 'constants/assetsConstants';
import { SET_FETCHING_HISTORY, SET_HISTORY } from 'constants/historyConstants';
import { SET_FETCHING_RATES } from 'constants/ratesConstants';
import { CHAIN } from 'constants/chainConstants';
import { SET_FETCHING_TOTAL_BALANCES } from 'constants/totalsBalancesConstants';

// actions
import { setupAppServicesAction, setupUserAction, setupWalletAction } from 'actions/onboardingActions';
import { localAssets } from 'actions/assetsActions';

// services
import etherspotService from 'services/etherspot';
import archanovaService from 'services/archanova';
import { firebaseAnalytics } from 'services/firebase';

// test utils
import {
  mockEtherspotAccount,
  mockEtherspotApiAccount,
  mockArchanovaAccount,
  mockArchanovaAccountApiData,
  mockArchanovaConnectedAccount,
  mockSupportedAssets,
  mockEtherspotAccountExtra,
  mockEthAddress,
  mockPlrAddress,
  mockDeviceUniqueId,
} from 'testUtils/jestSetup';

// types
import type { EthereumWallet } from 'models/Wallet';

global.WebSocket = WebSocket;

jest.setTimeout(20000);

const mockUser = { username: 'snow' };

const mockMessage = 'onboardingLoaders.initEtherspot';

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

const mockNewArchanovaAccount = { ...mockArchanovaAccount, extra: mockArchanovaAccountApiData };
const mockNewEtherspotAccount = { ...mockEtherspotAccount, extra: mockEtherspotAccountExtra };

const mockAssetsBalancesStore = {
  data: {
    [mockEtherspotAccount.id]: {
      ethereum: {
        wallet: {
          [mockEthAddress]: { balance: '1', symbol: ETH, address: mockEthAddress },
          [mockPlrAddress]: { balance: '1', symbol: PLR, address: mockPlrAddress },
        },
      },
    },
  },
};

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
  dispatched on setupAppServicesAction execution when network is online
  and Archanova account does not exist`, () => {
    jest.spyOn(archanovaService, 'getAccounts').mockReturnValueOnce([]);

    store = mockStore({
      session: { data: { isOnline: true } },
      wallet: {
        backupStatus: mockBackupStatus,
        data: mockImportedWallet,
      },
      user: { data: mockUser },
      accounts: { data: [] },
      smartWallet: {},
      assets: { supportedAssets: { ethereum: mockSupportedAssets } },
      history: { data: {} },
      assetsBalances: mockAssetsBalancesStore,
      rates: { data: {} },
      badges: { data: [] },
      totalBalances: {},
      onboarding: mockOnboarding,
    });

    const expectedActions = [
      { type: UPDATE_SESSION, payload: { fcmToken: mockFcmToken } },
      {
        type: SET_CHAIN_SUPPORTED_ASSETS,
        payload: { chain: CHAIN.ETHEREUM, assets: mockSupportedAssets },
      },
      { type: SET_ARCHANOVA_SDK_INIT, payload: true }, // archanova init for account check

      // etherspot
      { type: UPDATE_ACCOUNTS, payload: [mockNewEtherspotAccount] },

      { payload: true, type: SET_FETCHING_TOTAL_BALANCES },
      { payload: false, type: SET_FETCHING_TOTAL_BALANCES },

      { type: SET_FETCHING_HISTORY, payload: true },
      { type: SET_FETCHING_RATES, payload: true },
      { type: SET_FETCHING_HISTORY, payload: false },
      { type: SET_FETCHING_RATES, payload: false },

      // TODO: etherspot history update tba with separate PR
    ];

    return store.dispatch(setupAppServicesAction(randomPrivateKey)).then(() => {
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expect.arrayContaining(expectedActions));
    });
  });

  it(`should expect series of actions with payload to be
  dispatched on setupAppServicesAction execution when network is online
  and Archanova account exists`, () => {
    store = mockStore({
      session: { data: { isOnline: true } },
      wallet: {
        backupStatus: mockBackupStatus,
        data: mockImportedWallet,
      },
      user: { data: mockUser },
      accounts: { data: [mockArchanovaAccount] },
      smartWallet: {
        connectedAccount: mockArchanovaConnectedAccount,
        upgrade: { status: '' },
      },
      assets: { supportedAssets: { ethereum: mockSupportedAssets } },
      history: { data: {} },
      assetsBalances: mockAssetsBalancesStore,
      rates: { data: {} },
      badges: { data: [] },
      walletEvents: { data: [] },
      totalBalances: {},
      onboarding: mockOnboarding,
    });

    const expectedActions = [
      { type: UPDATE_SESSION, payload: { fcmToken: mockFcmToken } },
      {
        type: SET_CHAIN_SUPPORTED_ASSETS,
        payload: { chain: CHAIN.ETHEREUM, assets: mockSupportedAssets },
      },
      {
        type: SET_LOADING_MESSAGE,
        payload: mockMessage,
      },
      { type: SET_ARCHANOVA_SDK_INIT, payload: true }, // archanova init for account check

      // archanova
      { type: SET_ARCHANOVA_WALLET_ACCOUNTS, payload: [mockArchanovaAccountApiData] },
      { type: UPDATE_ACCOUNTS, payload: [mockNewArchanovaAccount] },

      // etherspot
      { type: UPDATE_ACCOUNTS, payload: [mockNewArchanovaAccount, mockNewEtherspotAccount] },

      { payload: true, type: SET_FETCHING_TOTAL_BALANCES },

      { type: SET_FETCHING_HISTORY, payload: true },
      { type: SET_FETCHING_RATES, payload: true },


      { type: SET_FETCHING_RATES, payload: false },

      { type: NFT_FLAG, payload: undefined },

      // TODO: etherspot history update tba with separate PR
    ];

    return store.dispatch(setupAppServicesAction(randomPrivateKey)).then(() => {
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expect.arrayContaining(expectedActions));
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
