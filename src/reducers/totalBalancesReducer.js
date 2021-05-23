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
  SET_FETCHING_TOTAL_BALANCES,
  SET_TOTAL_BALANCES,
  SET_ACCOUNT_TOTAL_BALANCE,
  RESET_ACCOUNT_TOTAL_BALANCES,
} from 'constants/totalsBalancesConstants';

// utils
import { BigNumber } from 'utils/common';

// types
import type { ChainTotalBalancesPerAccount } from 'models/Balances';


export type TotalBalancesReducerState = {
  data: ChainTotalBalancesPerAccount,
  isFetching: boolean,
};

export type SetFetchingTotalBalancesAction = {|
  type: typeof SET_FETCHING_TOTAL_BALANCES,
  payload: boolean,
|};

export type SetTotalBalancesAction = {|
  type: typeof SET_TOTAL_BALANCES,
  payload: ChainTotalBalancesPerAccount,
|};

export type SetAccountTotalChainCategoryBalanceAction = {|
  type: typeof SET_ACCOUNT_TOTAL_BALANCE,
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

export type TotalBalancesReducerAction = SetFetchingTotalBalancesAction
  | SetTotalBalancesAction
  | SetAccountTotalChainCategoryBalanceAction
  | ResetAccountTotalBalancesAction;

export const initialState = {
  data: {},
  isFetching: false,
};

const setNewBalance = (balancesState, accountId, chain, category, newBalance) => ({
  ...balancesState,
  [accountId]: {
    ...(balancesState?.[accountId] ?? {}),
    [chain]: {
      ...(balancesState?.[accountId]?.[chain] ?? {}),
      [category]: newBalance,
    },
  },
});


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

    case SET_ACCOUNT_TOTAL_BALANCE:
      const {
        accountId,
        chain,
        category,
        balance,
      } = action.payload;
      return {
        ...state,
        data: setNewBalance(state.data, accountId, chain, category, balance),
      };

    default:
      return state;
  }
}
