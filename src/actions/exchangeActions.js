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


import ExchangeService from 'services/exchange';
import { RESET_OFFERS, APPEND_OFFER } from 'constants/exchangeConstants';

const exchangeService = new ExchangeService();

export const searchOffersAction = (sellToken: string, buyToken: string, sellAmount: string) => {
  return async (dispatch: Function, getState: Function) => {
    dispatch({ type: RESET_OFFERS });
    console.log('sellToken: ', sellToken);
    console.log('buyToken: ', buyToken);
    console.log('sellAmount: ', sellAmount);
    const { oAuthTokens: { data: oAuthTokens } } = getState();
    exchangeService.listen(oAuthTokens.accessToken);
    exchangeService.onConnect(async () => {
      console.log('ws connected!');
      // TODO: pass assets symbols from action
      // this triggers ws event
      const result = await exchangeService.requestOffers('SNT', 'ETH');
      if (result.error) {
        // TODO: handle error
        console.log('errr', result);
      }
    });
    exchangeService.onOffers(offers =>
      offers.map(offer =>
        dispatch({ type: APPEND_OFFER, payload: offer }),
      ),
    );
  };
};
