// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
  SET_FETCHING_TOTALS,
  SET_TOTALS,
  SET_ACCOUNT_TOTALS,
} from 'constants/totalsConstants';

// types
import type {
  AccountsTotals,
  CategoryBalancesPerChain,
} from 'models/Home';


export type TotalsReducerState = {
  data: AccountsTotals,
  isFetching: boolean,
};

export type SetFetchingTotalsAction = {|
  type: typeof SET_FETCHING_TOTALS,
  payload: boolean,
|};

export type SetTotalsAction = {|
  type: typeof SET_TOTALS,
  payload: AccountsTotals,
|};

export type SetAccountTotalsAction = {|
  type: typeof SET_ACCOUNT_TOTALS,
  payload: { accountId: string, totals: CategoryBalancesPerChain }
|};

export type TotalsReducerAction = SetFetchingTotalsAction
  | SetTotalsAction
  | SetAccountTotalsAction;

export const initialState = {
  data: {},
  isFetching: false,
};

export default function totalsReducer(
  state: TotalsReducerState = initialState,
  action: TotalsReducerAction,
): TotalsReducerState {
  switch (action.type) {
    case SET_FETCHING_TOTALS:
      return { ...state, isFetching: action.payload };

    case SET_TOTALS:
      return { ...state, data: action.payload };

    case SET_ACCOUNT_TOTALS:
      const { accountId, totals: accountTotals } = action.payload;
      return { ...state, data: { ...state.data, [accountId]: accountTotals } };

    default:
      return state;
  }
}
