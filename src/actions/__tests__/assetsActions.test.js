// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  UPDATE_ASSET,
  UPDATE_ASSETS_STATE,
  FETCHED,
  FETCHING,
  ETH,
  UPDATE_BALANCES,
} from 'constants/assetsConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import type { Assets } from 'models/Asset';
import PillarSdk from 'services/api';
import { sendAssetAction, fetchAssetsBalancesAction } from '../assetsActions';

const pillarSdk = new PillarSdk();
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk)]);
const mockWallet: Object = {
  address: '0x9c',
};

const mockTransaction: Object = {
  gasLimit: 2000000,
  amount: 0.5,
  address: '000x124',
  gasPrice: 15000,
};

const mockAssets: Assets = {
  ETH: {
    symbol: ETH,
    name: 'ethereum',
    balance: 1,
    address: '',
    description: '',
    iconUrl: '',
    iconMonoUrl: '',
    wallpaperUrl: '',
    decimals: 18,
  },
};

const mockExchangeRates = {
  ETH: {
    EUR: 624.21,
    GBP: 544.57,
    USD: 748.92,
  },
};

Object.defineProperty(mockWallet, 'sendTransaction', {
  value: () => Promise.resolve('trx_hash'),
});

const initialState = {
  wallet: { data: mockWallet },
  assets: { data: { [ETH]: { balance: 10 } } },
};

describe('Wallet actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore(initialState);
  });

  xit('should expect series of actions with payload to be dispatch on sendAssetAction execution', () => {
    const expectedActions = [
      { type: UPDATE_ASSETS_STATE, payload: FETCHING },
      { type: UPDATE_ASSET, payload: { symbol: ETH, balance: 9.5 } },
      { type: UPDATE_ASSETS_STATE, payload: FETCHED },
    ];

    return store.dispatch(sendAssetAction(mockTransaction))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('should expect series of actions with payload to be dispatch on fetchAssetsBalancesAction execution', () => {
    const updateBalancesPayload = { ETH: { balance: 1, symbol: 'ETH' } };
    const expectedActions = [
      { payload: FETCHING, type: UPDATE_ASSETS_STATE },
      { payload: updateBalancesPayload, type: UPDATE_BALANCES },
      { payload: mockExchangeRates, type: UPDATE_RATES },
    ];
    return store.dispatch(fetchAssetsBalancesAction(mockAssets, mockWallet.address))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
