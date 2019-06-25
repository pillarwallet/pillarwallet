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

import { Linking } from 'react-native';
import ExchangeService from 'services/exchange';
import Toast from 'components/Toast';
import {
  RESET_OFFERS,
  ADD_OFFER,
  SET_SHAPESHIFT_ACCESS_TOKEN,
} from 'constants/exchangeConstants';

import type { Offer } from 'models/Offer';
import { saveDbAction } from './dbActions';

const exchangeService = new ExchangeService();

const connectExchangeService = (state: Object) => {
  const {
    oAuthTokens: { data: oAuthTokens },
    exchange: { data: { shapeshiftAccessToken } },
  } = state;
  // proceed with new instance only if one is not running and access token changed
  if (exchangeService.connected()) {
    const {
      accessToken: existingAccessToken,
      shapeshiftAccessToken: existingShapeshiftToken,
    } = exchangeService.tokens || {};
    if (existingAccessToken === oAuthTokens.accessToken
      && existingShapeshiftToken === shapeshiftAccessToken) return;
  }
  exchangeService.connect(oAuthTokens.accessToken, shapeshiftAccessToken);
};

export const takeOfferAction = (
  fromAssetCode: string,
  toAssetCode: string,
  fromAmount: number,
  provider: string,
  successCallback: Function,
) => {
  return async () => {
    const offerRequest = {
      quantity: parseFloat(fromAmount),
      provider,
      fromAssetCode,
      toAssetCode,
    };
    const order = await exchangeService.takeOffer(offerRequest);
    if (!order || !order.data || order.error) {
      Toast.show({
        title: 'Exchange service failed',
        type: 'warning',
        message: 'Unable to request offer',
      });
      return;
    }
    successCallback(order);
  };
};

export const resetOffersAction = () => ({
  type: RESET_OFFERS,
});

export const searchOffersAction = (fromAssetCode: string, toAssetCode: string, fromAmount: number) => {
  return async (dispatch: Function, getState: Function) => {
    dispatch(resetOffersAction());
    connectExchangeService(getState());
    exchangeService.onOffers(offers =>
      offers
        .filter(({ askRate = 0, minQuantity = 0, maxQuantity = 0 }) => {
          if (!askRate) return false;
          return fromAmount >= parseFloat(minQuantity)
            && (parseFloat(maxQuantity) === 0 || fromAmount <= parseFloat(maxQuantity));
        })
        .map((offer: Offer) => dispatch({ type: ADD_OFFER, payload: offer })),
    );
    // we're requesting although it will start delivering when connection is established
    const result = await exchangeService.requestOffers(fromAssetCode, toAssetCode);
    if (result.error) {
      Toast.show({
        title: 'Exchange service failed',
        type: 'warning',
        message: 'Unable to connect',
      });
    }
  };
};

export const authorizeWithShapeshiftAction = () => {
  return (dispatch: Function, getState: Function) => {
    connectExchangeService(getState());
    const shapeshiftAuthUrl = exchangeService.getShapeshiftAuthUrl();
    return Linking.canOpenURL(shapeshiftAuthUrl)
      .then((supported) => {
        if (supported) Linking.openURL(shapeshiftAuthUrl);
      })
      .catch(() => {
        Toast.show({
          title: 'Shapeshift authorize failed',
          type: 'warning',
          message: 'Cannot get authorize url',
        });
      });
  };
};

export const setShapeshiftAccessTokenAction = (token: ?string) => {
  return (dispatch: Function) => {
    dispatch({
      type: SET_SHAPESHIFT_ACCESS_TOKEN,
      payload: token,
    });
    dispatch(saveDbAction('exchange', { shapeshiftAccessToken: token }, true));
  };
};

export const resetShapeshiftAccessTokenAction = () => {
  return (dispatch: Function) => {
    dispatch(setShapeshiftAccessTokenAction(null));
  };
};

export const requestShapeshiftAccessTokenAction = (tokenHash: string) => {
  return async (dispatch: Function, getState: Function) => {
    connectExchangeService(getState());
    const { token: shapeshiftAccessToken, error } = await exchangeService.getShapeshiftAccessToken(tokenHash) || {};
    if (error || !shapeshiftAccessToken) {
      Toast.show({
        title: 'Shapeshift authorize failed',
        type: 'warning',
        message: 'Cannot get Shapeshift access token',
      });
      return;
    }
    dispatch(setShapeshiftAccessTokenAction(shapeshiftAccessToken));
  };
};
