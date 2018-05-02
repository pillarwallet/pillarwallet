// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  UPDATE_WALLET_STATE,
  GENERATE_ENCRYPTED_WALLET,
  DECRYPT_WALLET,
  DECRYPTING,
  GENERATING,
  ENCRYPTING,
} from 'constants/walletConstants';
import { ASSETS, NEW_WALLET } from 'constants/navigationConstants';
import { generateEncryptedWalletAction, decryptWalletAction } from '../walletActions';

const NAVIGATE = 'Navigation/NAVIGATE';
const mockStore = configureMockStore([thunk]);

const mockWallet: Object = {
  address: '0x9c',
  privateKey: '',
};
const mockOnboarding: Object = {
  confirmedPin: '',
  importedWallet: null,
  mnemonic: { original: '', shuffled: '', wordsToValidate: [] },
  pin: '',
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

describe('Wallet actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore({});
  });

  it(`should expect series of actions with payload to be dispatch on 
    generateEncryptedWalletAction execution when wallet wasn't imported`, () => {
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
      { type: NAVIGATE, routeName: ASSETS },
    ];

    return store.dispatch(generateEncryptedWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it(`should expect series of actions with payload to be dispatch on 
    generateEncryptedWalletAction execution when wallet was imported`, () => {
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
      { type: NAVIGATE, routeName: ASSETS },
    ];

    return store.dispatch(generateEncryptedWalletAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should expect series of actions with payload to be dispatch on decryptWalletAction execution', () => {
    const expectedActions = [
      { type: UPDATE_WALLET_STATE, payload: DECRYPTING },
      { type: DECRYPT_WALLET, payload: mockWallet },
      { type: NAVIGATE, routeName: ASSETS },
    ];
    const pin = '123456';

    return store.dispatch(decryptWalletAction(pin))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
