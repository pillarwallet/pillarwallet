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
import { UPDATE_RATES } from 'constants/ratesConstants';

type Rates = {
  [key: string]: {
    [key: string]: number,
  },
};

export type RatesReducerState = {
  data: Rates,
  isFetched: boolean,
};

export type RatesReducerAction = {
  type: string,
  payload: any
};

export const initialState = {
  data: {},
  isFetched: false,
};

const ratesReducer = (
  state: RatesReducerState = initialState,
  action: RatesReducerAction,
): RatesReducerState => {
  switch (action.type) {
    case UPDATE_RATES:
      return { ...state, data: action.payload, isFetched: true };
    default:
      return state;
  }
};

export default ratesReducer;
