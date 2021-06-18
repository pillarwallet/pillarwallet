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

// constants
import { SET_CHAIN_RATES, SET_RATES } from 'constants/ratesConstants';

// types
import type { RatesPerChain } from 'models/RatesByAssetSymbol';


export type RatesReducerState = {
  data: RatesPerChain,
  isFetching: boolean,
};

export type RatesReducerAction = {
  type: string,
  payload: any
};

export const initialState = {
  data: { ethereum: {} },
  isFetching: false,
};

const ratesReducer = (
  state: RatesReducerState = initialState,
  action: RatesReducerAction,
): RatesReducerState => {
  switch (action.type) {
    case SET_RATES:
      return {
        ...state,
        data: action.payload,
      };
    case SET_CHAIN_RATES:
      const { chain, rates } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [chain]: rates,
        },
      };
    default:
      return state;
  }
};

export default ratesReducer;
