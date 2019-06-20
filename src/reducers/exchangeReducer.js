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
import {
  ADD_OFFER,
  RESET_OFFERS,
  SET_SHAPESHIFT_ACCESS_TOKEN,
} from 'constants/exchangeConstants';
import type { Offer } from 'models/Offer';

export type ExchangeReducerState = {
  data: {
    offers: Offer[],
    shapeshiftAccessToken?: string,
  },
};

export type ExchangeReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {
    offers: [],
  },
};

export default function exchangeReducer(
  state: ExchangeReducerState = initialState,
  action: ExchangeReducerAction,
): ExchangeReducerState {
  switch (action.type) {
    case RESET_OFFERS:
      return {
        ...state,
        data: {
          ...state.data,
          offers: [],
        },
      };
    case ADD_OFFER:
      return {
        ...state,
        data: {
          ...state.data,
          offers: [
            ...state.data.offers.filter(offer => offer._id !== action.payload._id),
            action.payload,
          ],
        },
      };
    case SET_SHAPESHIFT_ACCESS_TOKEN:
      return {
        ...state,
        data: {
          ...state.data,
          shapeshiftAccessToken: action.payload,
        },
      };
    default:
      return state;
  }
}
