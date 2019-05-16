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
import { APPEND_OFFER } from 'constants/exchangeConstants';
import type { SearchResults, Offer } from 'models/Exchange';

export type ExchangeReducerState = {
  data: SearchResults,
};

export type ExchangeReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {
    offers: [
      {
        key: 'test1',
        provider: 'test1',
        toAssetCode: '',
        minQuantity: 0,
        maxQuantity: 10,
        fromAssetCode: '',
        description: '',
        askRate: 0,
      },
      {
        key: 'test2',
        provider: 'test2',
        toAssetCode: '',
        minQuantity: 0,
        maxQuantity: 10,
        fromAssetCode: '',
        description: '',
        askRate: 0,
      },
      {
        key: 'test3',
        provider: 'test3',
        toAssetCode: '',
        minQuantity: 0,
        maxQuantity: 10,
        fromAssetCode: '',
        description: '',
        askRate: 0,
      },
    ],
  },
};

export default function badgesReducer(
  state: ExchangeReducerState = initialState,
  action: ExchangeReducerAction,
): ExchangeReducerState {
  return state;
  // switch (action.type) {
  //   case APPEND_OFFER:
  //     const { data: { offers } } = state;
  //
  //     const newOffers = [...offers, action.payload];
  //
  //     return {
  //       ...state,
  //       data: { offers: newOffers }
  //     };
  //   default:
  //     return state;
  // }
}
