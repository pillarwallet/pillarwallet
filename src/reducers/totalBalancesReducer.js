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

import { BigNumber } from 'bignumber.js';

// Constants
import {
  SET_FETCHING_TOTAL_BALANCES,
  SET_TOTAL_BALANCES,
  SET_ACCOUNT_CATEGORY_CHAIN_TOTAL_BALANCE,
  RESET_ACCOUNT_TOTAL_BALANCES,
} from 'constants/totalsBalancesConstants';

// Types
import type { TotalBalancesPerAccount } from 'models/TotalBalances';

// State
export type TotalBalancesReducerState = {
  data: TotalBalancesPerAccount,
  isFetching: boolean,
};


// Actions
export type SetFetchingTotalBalancesAction = {|
  type: typeof SET_FETCHING_TOTAL_BALANCES,
  payload: boolean,
|};

export type SetTotalBalancesAction = {|
  type: typeof SET_TOTAL_BALANCES,
  payload: TotalBalancesPerAccount,
|};

export type SetAccountCategoryChainTotalBalanceAction = {|
  type: typeof SET_ACCOUNT_CATEGORY_CHAIN_TOTAL_BALANCE,
  payload: {
    accountId: string,
    chain: string,
    category: string,
    balance: BigNumber,
  }
|};

export type ResetAccountTotalBalancesAction = {|
  type: typeof RESET_ACCOUNT_TOTAL_BALANCES,
  payload: string,
|};

export type TotalBalancesReducerAction =
  | SetFetchingTotalBalancesAction
  | SetTotalBalancesAction
  | SetAccountCategoryChainTotalBalanceAction
  | ResetAccountTotalBalancesAction;

export const initialState = {
  data: {},
  isFetching: false,
};

const setNewBalance = (balancesState, accountId, category, chain, balance) => {
  return {
    ...balancesState,
    [accountId]: {
      ...balancesState?.[accountId],
      [category]: {
        ...balancesState?.[accountId]?.[category],
        [chain]: balance,
      },
    },
  };
};

export default function totalBalancesReducer(
  state: TotalBalancesReducerState = initialState,
  action: TotalBalancesReducerAction,
): TotalBalancesReducerState {
  switch (action.type) {
    case SET_FETCHING_TOTAL_BALANCES:
      return { ...state, isFetching: action.payload };

    case SET_TOTAL_BALANCES:
      return { ...state, data: action.payload };

    case RESET_ACCOUNT_TOTAL_BALANCES:
      return { ...state, data: { ...state.data, [action.payload]: {} } };

    case SET_ACCOUNT_CATEGORY_CHAIN_TOTAL_BALANCE:
      const { accountId, chain, category, balance } = action.payload;
      return {
        ...state,
        data: setNewBalance(state.data, accountId, category, chain, balance),
      };

    default:
      return state;
  }
}
