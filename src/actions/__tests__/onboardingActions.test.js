// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';
import {
  UPDATE_WALLET_STATE,
  GENERATE_ENCRYPTED_WALLET,
  GENERATING,
  ENCRYPTING,
  REGISTERING,
} from 'constants/walletConstants';
import { SET_INITIAL_ASSETS, UPDATE_ASSETS } from 'constants/assetsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { UPDATE_USER, REGISTERED } from 'constants/userConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';
import { SET_HISTORY } from 'constants/historyConstants';
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

const pillarSdk: SDK = new PillarSdk();
pillarSdk.registerOnBackend = jest.fn(() => ({ userId: 1, walletId: 2 }));
pillarSdk.updateUser = jest.fn(() => ({ username: 'snow', walletId: 2 }));
pillarSdk.userInfo = jest.fn(() => ({ username: 'snow', walletId: 2 }));
pillarSdk.fetchInitialAssets = jest.fn(() => transformAssetsToObject(mockInitialAssets));
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const mockWallet: Object = {
  address: '0x9c',
};
const mockImportedWallet: Object = {
  address: '0x9c',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
  RNencrypt: () => Promise.resolve({ address: 'encry_pted' }),
};

const mockOnboarding: Object = {
  confirmedPin: '',
  importedWallet: null,
  mnemonic: {
    original: '',
    shuffled: '',
    wordsToValidate: [],
  },
  apiUser: { username: 'asd' },
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
      { type: UPDATE_CONTACTS, payload: [] },
      { type: UPDATE_INVITATIONS, payload: [] },
      { type: UPDATE_ASSETS, payload: {} },
      { type: UPDATE_APP_SETTINGS, payload: {} },
      { type: UPDATE_ACCESS_TOKENS, payload: [] },
      { type: SET_HISTORY, payload: [] },
      { type: UPDATE_WALLET_STATE, payload: GENERATING },
      { type: UPDATE_WALLET_STATE, payload: ENCRYPTING },
      { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet },
      { type: UPDATE_WALLET_STATE, payload: REGISTERING },
      { type: UPDATE_USER, payload: { state: REGISTERED, user: { username: 'snow', walletId: 2 } } },
      { type: UPDATE_RATES, payload: mockExchangeRates },
      { type: SET_INITIAL_ASSETS, payload: transformAssetsToObject(mockInitialAssets) },
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
          importedWallet: mockImportedWallet,
        },
      },
    });
    const expectedActions = [
      { type: UPDATE_CONTACTS, payload: [] },
      { type: UPDATE_INVITATIONS, payload: [] },
      { type: UPDATE_ASSETS, payload: {} },
      { type: UPDATE_APP_SETTINGS, payload: {} },
      { type: UPDATE_ACCESS_TOKENS, payload: [] },
      { type: SET_HISTORY, payload: [] },
      { type: UPDATE_WALLET_STATE, payload: ENCRYPTING },
      { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet },
      { type: UPDATE_WALLET_STATE, payload: REGISTERING },
      { type: UPDATE_USER, payload: { state: REGISTERED, user: { username: 'snow', walletId: 2 } } },
      { type: UPDATE_RATES, payload: mockExchangeRates },
      { type: SET_INITIAL_ASSETS, payload: transformAssetsToObject(mockInitialAssets) },
    ];

    return store.dispatch(registerWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
