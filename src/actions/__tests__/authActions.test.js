// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  DECRYPTING,
} from 'constants/walletConstants';
import { ASSETS } from 'constants/navigationConstants';
import Storage from 'services/storage';
import { decryptWalletAction } from '../authActions';

const NAVIGATE = 'Navigation/NAVIGATE';
const mockStore = configureMockStore([thunk]);

const mockWallet: Object = {
  address: '0x9c',
  privateKey: '',
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

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    return storage.save('wallet', mockWallet);
  });

  beforeEach(() => {
    store = mockStore({});
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
