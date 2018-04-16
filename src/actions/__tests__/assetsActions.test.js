// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { UPDATE_ASSET, UPDATE_ASSETS_STATE, FETCHED, FETCHING, ETH } from 'constants/assetsConstants';
import { sendAssetAction, fetchEtherBalanceAction } from '../assetsActions';

const mockStore = configureMockStore([thunk]);
const mockWallet: Object = {
  address: '0x9c',
};

const mockTranscation: Object = {
  gasLimit: 2000000,
  amount: 0.5,
  address: '000x124',
  gasPrice: 15000,
};

Object.defineProperty(mockWallet, 'sendTransaction', {
  value: () => Promise.resolve('trx_hash'),
});

jest.mock('ethers', () => ({
  Wallet: {
    fromMnemonic: () => mockWallet,
    fromEncryptedWallet: () => mockWallet,
  },
  utils: {
    parseEther: x => x,
    bigNumberify: x => x,
  },
  providers: {
    getDefaultProvider: () => ({
      getBalance: () => Promise.resolve(5), // ropsten dummy balance
    }),
  },
}));

const initialState = {
  wallet: { data: mockWallet },
  assets: { data: { [ETH]: { balance: 10 } } },
};

describe('Wallet actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore(initialState);
  });

  it('should expect series of actions with payload to be dispatch on sendAssetAction execution', () => {
    const expectedActions = [
      { type: UPDATE_ASSETS_STATE, payload: FETCHING },
      { type: UPDATE_ASSET, payload: { id: ETH, balance: 9.5 } },
      { type: UPDATE_ASSETS_STATE, payload: FETCHED },
    ];

    return store.dispatch(sendAssetAction(mockTranscation))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should expect series of actions with payload to be dispatch on fetchEtherBalanceAction execution', () => {
    const expectedActions = [
      { payload: FETCHING, type: UPDATE_ASSETS_STATE },
      { payload: { balance: 5, id: ETH }, type: UPDATE_ASSET },
      { payload: FETCHED, type: UPDATE_ASSETS_STATE },
    ];

    return store.dispatch(fetchEtherBalanceAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
