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
  APPEND_OFFER,
  SET_SHAPESHIFT_ACCESS_TOKEN,
} from 'constants/exchangeConstants';

import type { Offer } from 'models/Offer';
import { saveDbAction } from './dbActions';

const exchangeService = new ExchangeService();

export const takeOfferAction = (fromAssetCode: string, toAssetCode: string, fromAmount: number, provider: string) => {
  return async () => {
    const offerRequest = {
      quantity: parseFloat(fromAmount),
      provider,
      fromAssetCode: 'SNT',
      toAssetCode: 'ETH',
    };
    console.log('offer request: ', offerRequest);
    const order = await exchangeService.takeOffer(offerRequest);
    console.log('offer order: ', order);
    return order;
  };
};

export const searchOffersAction = (fromAssetCode: string, toAssetCode: string, fromAmount: number) => {
  return async (dispatch: Function, getState: Function) => {
    dispatch({ type: RESET_OFFERS });
    console.log('sellToken: ', fromAssetCode);
    console.log('buyToken: ', toAssetCode);
    console.log('sellAmount: ', fromAmount);
    const {
      oAuthTokens: { data: oAuthTokens },
      exchange: { data: { shapeshiftAccessToken } },
    } = getState();
    exchangeService.listen(oAuthTokens.accessToken, shapeshiftAccessToken);
    exchangeService.onConnect(async () => {
      // TODO: pass assets symbols from action
      // this triggers ws event
      const result = await exchangeService.requestOffers('SNT', 'ETH');
      if (result.error) {
        Toast.show({
          message: 'Exchange service failed',
          type: 'warning',
          title: 'Unable to connect',
        });
      }
    });
    exchangeService.onOffers(offers =>
      offers.map((offer: Offer) => dispatch({ type: APPEND_OFFER, payload: offer })),
    );
  };
};

export const authorizeWithShapeshiftAction = () => {
  return () => {
    const shapeshiftAuthUrl = exchangeService.getShapeshiftAuthUrl();
    return Linking.canOpenURL(shapeshiftAuthUrl)
      .then((supported) => {
        if (supported) Linking.openURL(shapeshiftAuthUrl);
      })
      .catch(() => {
        Toast.show({
          message: 'Unable to authorize with Shapeshift',
          type: 'warning',
          title: 'Cannot get authorize url',
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
