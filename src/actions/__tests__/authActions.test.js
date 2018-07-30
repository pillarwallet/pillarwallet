// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  DECRYPTING,
} from 'constants/walletConstants';
import { APP_FLOW, ASSETS } from 'constants/navigationConstants';
import Storage from 'services/storage';
import PillarSdk from 'services/api';
import { checkPinAction } from '../authActions';

const NAVIGATE = 'Navigation/NAVIGATE';
const pillarSdk = new PillarSdk();
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk)]);

const mockWallet: Object = {
  address: '0x9c',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
};

const mockUser: Object = {
  username: 'Jon',
};

Object.defineProperty(mockWallet, 'RNencrypt', {
  value: () => Promise.resolve({ address: 'encry_pted' }),
});

jest.mock('ethers', () => ({
  Wallet: {
    fromMnemonic: () => mockWallet,
    RNfromEncryptedWallet: () => mockWallet,
  },
}));

describe('Wallet actions', () => {
  let store;

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    storage.save('user', { user: mockUser });
    return storage.save('wallet', { wallet: mockWallet });
  });

  beforeEach(() => {
    store = mockStore({ assets: { data: {} } });
  });

  it('should expect series of actions with payload to be dispatch on checkPinAction execution', () => {
    const expectedActions = [
      { type: UPDATE_WALLET_STATE, payload: DECRYPTING },
      { type: DECRYPT_WALLET, payload: mockWallet },
      {
        type: NAVIGATE,
        routeName: APP_FLOW,
        params: {},
        action: { type: NAVIGATE, routeName: ASSETS },
      },
    ];

    const pin = '123456';

    return store.dispatch(checkPinAction(pin))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
