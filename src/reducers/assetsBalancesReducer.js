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
  RESET_ACCOUNT_ASSETS_BALANCES,
  SET_ACCOUNT_ASSETS_BALANCES,
  SET_ASSETS_BALANCES,
  SET_FETCHING_ASSETS_BALANCES,
} from 'constants/assetsBalancesConstants';

// types
import type { WalletAssetsBalances, AssetBalancesPerAccount } from 'models/Balances';


export type SetFetchingAssetsBalancesAction = {|
  type: typeof SET_FETCHING_ASSETS_BALANCES,
  payload: boolean,
|};

export type SetAssetsBalancesAction = {|
  type: typeof SET_ASSETS_BALANCES,
  payload: AssetBalancesPerAccount,
|};

export type SeAccountAssetsBalancesAction = {|
  type: typeof SET_ACCOUNT_ASSETS_BALANCES,
  payload: {
    accountId: string,
    chain: string,
    category: string,
    balances: WalletAssetsBalances,
  }
|};

export type ResetAccountBalancesAction = {|
  type: typeof RESET_ACCOUNT_ASSETS_BALANCES,
  payload: string,
|};

export type AssetsBalancesReducerAction = SetFetchingAssetsBalancesAction
  | SeAccountAssetsBalancesAction
  | SetAssetsBalancesAction
  | ResetAccountBalancesAction;

export type AssetsBalancesReducerState = {
  data: AssetBalancesPerAccount,
  isFetching: boolean,
};

export const initialState = {
  data: {},
  isFetching: false,
};

const setNewAssetsBalances = (balancesState, accountId, chain, category, newBalances) => ({
  ...balancesState,
  [accountId]: {
    ...(balancesState?.[accountId] ?? {}),
    [chain]: {
      ...(balancesState?.[accountId]?.[chain] ?? {}),
      [category]: newBalances,
    },
  },
});

export default function assetsBalancesReducer(
  state: AssetsBalancesReducerState = initialState,
  action: AssetsBalancesReducerAction,
): AssetsBalancesReducerState {
  switch (action.type) {
    case SET_FETCHING_ASSETS_BALANCES:
      return { ...state, isFetching: action.payload };

    case SET_ASSETS_BALANCES:
      return { ...state, data: action.payload };

    case RESET_ACCOUNT_ASSETS_BALANCES:
      return { ...state, data: { ...state.data, [action.payload]: {} } };

    case SET_ACCOUNT_ASSETS_BALANCES:
      const {
        accountId,
        chain,
        category,
        balances,
      } = action.payload;
      return { ...state, data: setNewAssetsBalances(state.data, accountId, chain, category, balances) };

    default:
      return state;
  }
}
