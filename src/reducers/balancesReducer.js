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
  RESET_ACCOUNT_BALANCES,
  SET_ACCOUNT_CHAIN_CATEGORY_BALANCES,
  SET_BALANCES,
  SET_FETCHING_BALANCES,
} from 'constants/balancesConstants';

// types
import type { Balances, ChainBalancesPerAccount } from 'models/Balances';


export type SetFetchingBalancesAction = {|
  type: typeof SET_FETCHING_BALANCES,
  payload: boolean,
|};

export type SetBalancesAction = {|
  type: typeof SET_BALANCES,
  payload: ChainBalancesPerAccount,
|};

export type SetAccountChainCategoryBalanceAction = {|
  type: typeof SET_ACCOUNT_CHAIN_CATEGORY_BALANCES,
  payload: {
    accountId: string,
    chain: string,
    category: string,
    balances: Balances,
  }
|};

export type ResetAccountBalancesAction = {|
  type: typeof RESET_ACCOUNT_BALANCES,
  payload: string,
|};

export type BalancesReducerAction = SetFetchingBalancesAction
  | SetAccountChainCategoryBalanceAction
  | SetBalancesAction
  | ResetAccountBalancesAction;

export type BalancesReducerState = {
  data: ChainBalancesPerAccount,
  isFetching: boolean,
};

export const initialState = {
  data: {},
  isFetching: false,
};

const setNewCategoryBalances = (balancesState, accountId, chain, category, newBalances) => ({
  ...balancesState,
  [accountId]: {
    ...(balancesState?.[accountId] ?? {}),
    [chain]: {
      ...(balancesState?.[accountId]?.[chain] ?? {}),
      [category]: newBalances,
    },
  },
});

export default function balancesReducer(
  state: BalancesReducerState = initialState,
  action: BalancesReducerAction,
): BalancesReducerState {
  switch (action.type) {
    case SET_FETCHING_BALANCES:
      return { ...state, isFetching: action.payload };

    case SET_BALANCES:
      return { ...state, data: action.payload };

    case RESET_ACCOUNT_BALANCES:
      return { ...state, data: { ...state.data, [action.payload]: {} } };

    case SET_ACCOUNT_CHAIN_CATEGORY_BALANCES:
      const {
        accountId,
        chain,
        category,
        balances,
      } = action.payload;
      return { ...state, data: setNewCategoryBalances(state.data, accountId, chain, category, balances) };

    default:
      return state;
  }
}
