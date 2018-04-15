// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { generateEncryptedWalletAction, decryptWalletAction, checkIfWalletExistsAction } from '../walletActions';
import {
  UPDATE_WALLET_STATE,
  GENERATE_ENCRYPTED_WALLET,
  DECRYPT_WALLET,
  DECRYPTING,
  GENERATING,
  ENCRYPTING,
} from '../../constants/walletConstants';

const mockStore = configureMockStore([thunk]);
const mockWallet: Object = {
  address: '0x9c',
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
  it('should expect series of actions with payload to be dispatch on generateEncryptedWalletAction execution', () => {
    const store = mockStore({});
    const expectedActions = [
      { type: UPDATE_WALLET_STATE, payload: GENERATING },
      { type: UPDATE_WALLET_STATE, payload: ENCRYPTING },
      { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet },
    ];
    const mnemonic = '1 2 3 4 5 6 7 8 9 10 11 12';
    const pin = '123456';

    return store.dispatch(generateEncryptedWalletAction(mnemonic, pin))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should expect series of actions with payload to be dispatch on decryptWalletAction execution', () => {
    const store = mockStore({});
    const expectedActions = [
      { type: UPDATE_WALLET_STATE, payload: DECRYPTING },
      { type: DECRYPT_WALLET, payload: mockWallet },
    ];
    const pin = '123456';

    return store.dispatch(decryptWalletAction(pin))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should expect series of actions with payload to be dispatch on checkIfWalletExists execution', () => {
    const store = mockStore({});
    const expectedActions = [
      UPDATE_WALLET_STATE,
    ];

    return store.dispatch(checkIfWalletExistsAction())
      .then(() => {
        const actualActions = store.getActions().map(action => action.type);
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
