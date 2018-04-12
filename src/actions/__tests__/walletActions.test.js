// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { generateEncryptedWalletAction, decryptWalletAction } from '../walletActions';
import { UPDATE_WALLET_STATE, GENERATE_ENCRYPTED_WALLET, DECRYPT_WALLET } from '../../constants/walletConstants';

const mockStore = configureMockStore([thunk]);

jest.mock('ethers', () => ({
  Wallet: {
    fromMnemonic: () => ({
      encrypt: () => Promise.resolve({
        address: '0x9c',
      }),
    }),
    fromEncryptedWallet: () => ({
      address: '0x9c',
    }),
  },
}));

describe('Wallet actions', () => {
  it('should expect series of actions to be dispatch on generateEncryptedWalletAction execution', () => {
    const store = mockStore({});
    const expectedActions = [
      UPDATE_WALLET_STATE, // GENERATING
      UPDATE_WALLET_STATE, // ENCRYPTING
      GENERATE_ENCRYPTED_WALLET,
    ];
    const mnemonic = '1 2 3 4 5 6 7 8 9 10 11 12';
    const pin = '123456';

    return store.dispatch(generateEncryptedWalletAction(mnemonic, pin))
      .then(() => {
        const actualActions = store.getActions().map(action => action.type);
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should expect series of actions to be dispatch on decryptWalletAction execution', () => {
    const store = mockStore({});
    const expectedActions = [
      UPDATE_WALLET_STATE, // DECRYPTING
      DECRYPT_WALLET,
    ];
    const pin = '123456';

    return store.dispatch(decryptWalletAction(pin))
      .then(() => {
        const actualActions = store.getActions().map(action => action.type);
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
