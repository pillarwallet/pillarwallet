// @flow

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  UPDATE_WALLET_STATE,
  GENERATE_ENCRYPTED_WALLET,
  GENERATING,
  ENCRYPTING,
} from 'constants/walletConstants';
import { ASSETS, NEW_WALLET, APP_FLOW } from 'constants/navigationConstants';
import { SET_INITIAL_ASSETS } from 'constants/assetsConstants';
import { SET_RATES } from 'constants/ratesConstants';
import { UPDATE_USER, REGISTERED } from 'constants/userConstants';
import { initialAssets as mockInitialAssets } from 'fixtures/assets';
import { registerWalletAction } from 'actions/onboardingActions';
import { transformAssetsToObject } from 'utils/assets';
import PillarSdk from 'services/api';
import Storage from 'services/storage';

type SDK = {
  registerOnBackend: Function,
  fetchInitialAssets: Function,
  updateUser: Function,
  userInfo: Function,
};

const NAVIGATE = 'Navigation/NAVIGATE';
const pillarSdk: SDK = new PillarSdk();
pillarSdk.registerOnBackend = jest.fn(() => ({ userId: 1, walletId: 2 }));
pillarSdk.updateUser = jest.fn(() => ({ username: 'snow', walletId: 2 }));
pillarSdk.userInfo = jest.fn(() => ({ username: 'snow', walletId: 2 }));
pillarSdk.fetchInitialAssets = jest.fn(() => transformAssetsToObject(mockInitialAssets));
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk)]);

const mockWallet: Object = {
  address: '0x9c',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
};
const mockOnboarding: Object = {
  confirmedPin: '',
  importedWallet: null,
  mnemonic: { original: '', shuffled: '', wordsToValidate: [] },
  pin: '',
};

const storage = Storage.getInstance('db');

const mockExchangeRates = {
  ETH: {
    EUR: 624.21,
    GBP: 544.57,
    USD: 748.92,
  },
};

Object.defineProperty(mockWallet, 'encrypt', {
  value: () => Promise.resolve({ address: 'encry_pted' }),
});

jest.mock('ethers', () => ({
  Wallet: {
    fromMnemonic: () => mockWallet,
    fromEncryptedWallet: () => mockWallet,
  },
}));

jest.mock('cryptocompare', () => ({
  priceMulti: () => Promise.resolve(mockExchangeRates),
}));

describe('Wallet actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore({});
    return storage.save('user', { user: { username: 'asd' } });
  });

  it(`should expect series of actions with payload to be dispatch 
  on registerWalletAction execution when wallet wasn't imported`, () => {
    store = mockStore({
      wallet: {
        onboarding: mockOnboarding,
      },
    });
    const expectedActions = [
      { type: NAVIGATE, routeName: NEW_WALLET },
      { type: UPDATE_WALLET_STATE, payload: GENERATING },
      { type: UPDATE_WALLET_STATE, payload: ENCRYPTING },
      { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet },
      { type: UPDATE_USER, payload: { state: REGISTERED, user: { username: 'snow', walletId: 2 } } },
      { type: SET_RATES, payload: mockExchangeRates },
      { type: SET_INITIAL_ASSETS, payload: transformAssetsToObject(mockInitialAssets) },
      {
        type: NAVIGATE,
        routeName: APP_FLOW,
        params: {},
        action: { type: NAVIGATE, routeName: ASSETS },
      },
    ];

    return store.dispatch(registerWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be 
  dispatch on registerWalletAction execution when wallet was imported`, () => {
    store = mockStore({
      wallet: {
        onboarding: {
          ...mockOnboarding,
          importedWallet: mockWallet,
        },
      },
    });
    const expectedActions = [
      { type: NAVIGATE, routeName: NEW_WALLET },
      { type: UPDATE_WALLET_STATE, payload: ENCRYPTING },
      { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet },
      { type: UPDATE_USER, payload: { state: REGISTERED, user: { username: 'snow', walletId: 2 } } },
      { type: SET_RATES, payload: mockExchangeRates },
      { type: SET_INITIAL_ASSETS, payload: transformAssetsToObject(mockInitialAssets) },
      {
        type: NAVIGATE,
        routeName: APP_FLOW,
        params: {},
        action: { type: NAVIGATE, routeName: ASSETS },
      },
    ];

    return store.dispatch(registerWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
