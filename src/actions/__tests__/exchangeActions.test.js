// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';
import axios from 'axios';
import PillarSdk from 'services/api';
import {
  SET_EXCHANGE_SEARCH_REQUEST,
  ADD_OFFER,
  PROVIDER_SHAPESHIFT,
  PROVIDER_MOONPAY,
  PROVIDER_SENDWYRE,
} from 'constants/exchangeConstants';
import { ETH } from 'constants/assetsConstants';
import { searchOffersAction } from 'actions/exchangeActions';

const walletId = 'walletId';
const oAuthTokensMock = {
  refreshToken: 'refreshToken',
  accessToken: 'accessToken',
};
const connectedProvidersMock = [
  {
    extra: 'shapeshiftAccessToken',
    id: PROVIDER_SHAPESHIFT,
  },
];

const exchangeSupportedAssetsMock = [
  {
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
];

const moonPayOfferMock = {
  provider: PROVIDER_MOONPAY,
  offerRestricted: null,
};
const sendWyreOfferMock = {
  provider: PROVIDER_SENDWYRE,
  offerRestricted: null,
};

type SDK = {
  fetchMoonPayOffers: Function,
  fetchSendWyreOffers: Function,
};

const pillarSdk: SDK = new PillarSdk();
pillarSdk.fetchMoonPayOffers = jest.fn(() => Promise.resolve({ provider: PROVIDER_MOONPAY }));
pillarSdk.fetchSendWyreOffers = jest.fn(() => Promise.resolve({ provider: PROVIDER_SENDWYRE }));

const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

describe('Exchange Actions tests', () => {
  let store;

  beforeAll(() => {
    jest.spyOn(axios, 'get').mockImplementation(() => Promise.resolve({
      data: {
        error: null,
        isAllowed: true,
        alpha2: 'US',
      },
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    const exchangeStoreMock = {
      user: { data: { walletId } },
      oAuthTokens: { data: { oAuthTokens: oAuthTokensMock } },
      exchange: {
        data: { connectedProviders: connectedProvidersMock },
        exchangeSupportedAssets: exchangeSupportedAssetsMock,
      },
    };
    store = mockStore({ ...exchangeStoreMock });
  });

  it('Should expect a set of actions from fiat offers by calling searchOffersAction with a set of assets', async () => {
    const expectedActions = [
      {
        type: SET_EXCHANGE_SEARCH_REQUEST,
        payload: {
          fromAssetCode: 'USD',
          toAssetCode: 'ETH',
          fromAmount: 20,
        },
      },
      { type: ADD_OFFER, payload: moonPayOfferMock },
      { type: ADD_OFFER, payload: sendWyreOfferMock },
    ];

    return store.dispatch(searchOffersAction('USD', 'ETH', 20))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
