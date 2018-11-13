// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';
import {
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  DECRYPTING,
} from 'constants/walletConstants';
import { UPDATE_USER, PENDING } from 'constants/userConstants';
import Storage from 'services/storage';
import PillarSdk from 'services/api';
import { loginAction } from '../authActions';

const pillarSdk = new PillarSdk();
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const mockWallet: Object = {
  address: '0x9c',
};

const mockUser: Object = {
  username: 'Jon',
};

Object.defineProperty(mockWallet, 'RNencrypt', {
  value: () => Promise.resolve({ address: 'encry_pted' }),
});

describe('Wallet actions', () => {
  let store;

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    storage.save('user', { user: mockUser });
    return storage.save('wallet', { wallet: mockWallet });
  });

  beforeEach(() => {
    store = mockStore({ assets: { data: {} }, navigation: {} });
  });

  it('should expect series of actions with payload to be dispatch on checkPinAction execution', () => {
    const expectedActions = [
      { type: UPDATE_WALLET_STATE, payload: DECRYPTING },
      { type: UPDATE_USER, payload: { user: mockUser, state: PENDING } },
      { type: DECRYPT_WALLET, payload: mockWallet },
    ];

    const pin = '123456';

    return store.dispatch(loginAction(pin))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
