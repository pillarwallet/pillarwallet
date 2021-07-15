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
import {
  UPDATE_CHAIN_RATES,
  SET_FETCHING_RATES,
  SET_RATES,
} from 'constants/ratesConstants';

// types
import type { RatesPerChain, RatesByAssetAddress } from 'models/Rates';


export type RatesReducerState = {
  data: RatesPerChain,
  isFetching: boolean,
};

export type SetFetchingRatesAction = {|
  type: typeof SET_FETCHING_RATES,
  payload: boolean,
|};

export type SetRatesAction = {|
  type: typeof SET_RATES,
  payload: RatesPerChain,
|};

export type UpdateChainRatesAction = {|
  type: typeof UPDATE_CHAIN_RATES,
  payload: {
    chain: string,
    rates: RatesByAssetAddress,
  },
|};

export type RatesReducerAction = SetFetchingRatesAction
  | SetRatesAction
  | UpdateChainRatesAction;

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

    case UPDATE_CHAIN_RATES:
      const { chain, rates } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [chain]: {
            ...(state.data[chain] ?? {}),
            ...rates,
          },
        },
      };

    case SET_FETCHING_RATES:
      return {
        ...state,
        isFetching: action.payload,
      };

    default:
      return state;
  }
};

export default ratesReducer;
