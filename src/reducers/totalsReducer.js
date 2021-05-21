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
  SET_TOTAL_BALANCES,
  SET_TOTAL_ACCOUNT_CHAIN_CATEGORY_BALANCE,
} from 'constants/totalsConstants';

// utils
import { BigNumber } from 'utils/common';

// types
import type { ChainBalancesPerAccount } from 'models/Home';


export type TotalsReducerState = {
  balances: ChainBalancesPerAccount,
  isFetching: boolean,
};

export type SetFetchingTotalsAction = {|
  type: typeof SET_FETCHING_TOTALS,
  payload: boolean,
|};

export type SetTotalBalancesAction = {|
  type: typeof SET_TOTAL_BALANCES,
  payload: ChainBalancesPerAccount,
|};

export type SetAccountTotalChainBalancesAction = {|
  type: typeof SET_TOTAL_ACCOUNT_CHAIN_CATEGORY_BALANCE,
  payload: {
    accountId: string,
    chain: string,
    category: string,
    balance: BigNumber,
  }
|};

export type TotalsReducerAction = SetFetchingTotalsAction
  | SetTotalBalancesAction
  | SetAccountTotalChainBalancesAction;

export const initialState = {
  balances: {},
  isFetching: false,
};

export default function totalsReducer(
  state: TotalsReducerState = initialState,
  action: TotalsReducerAction,
): TotalsReducerState {
  switch (action.type) {
    case SET_FETCHING_TOTALS:
      return { ...state, isFetching: action.payload };

    case SET_TOTAL_BALANCES:
      return { ...state, balances: action.payload };

    case SET_TOTAL_ACCOUNT_CHAIN_CATEGORY_BALANCE:
      const {
        accountId,
        chain,
        category,
        balance: accountChainCategoryBalance,
      } = action.payload;
      const accountChainBalances = state.balances?.[accountId]?.[chain] || {};
      const accountBalances = state.balances?.[accountId] || {};
      return {
        ...state,
        balances: {
          ...state.balances,
          [accountId]: {
            ...accountBalances,
            [chain]: {
              ...accountChainBalances,
              [category]: accountChainCategoryBalance,
            },
          },
        },
      };

    default:
      return state;
  }
}
