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
import { SET_APP_HOLDINGS, UPDATE_APP_HOLDINGS, SET_FETCHING_HOLDINGS } from 'constants/appsHoldingsConstants';

// types
import type { AppHoldings } from 'models/Investment';

export type AppsHoldingsReducerState = {
  data: AppHoldings[];
  isFetching: boolean;
};

export type SetFetchingAppsHoldingsAction = {
  type: typeof SET_FETCHING_HOLDINGS;
  payload: boolean;
};

export type SetAppsHoldingsAction = {
  type: typeof SET_APP_HOLDINGS;
  payload: AppHoldings[];
};

export type UpdateAppsHoldingsAction = {
  type: typeof UPDATE_APP_HOLDINGS;
  payload: AppHoldings[];
};

export type AppsHoldingsReducerAction =
  | SetFetchingAppsHoldingsAction
  | SetAppsHoldingsAction
  | UpdateAppsHoldingsAction;

export const initialState = {
  data: [],
  isFetching: false,
};

const appsHoldingsReducer = (
  state: AppsHoldingsReducerState = initialState,
  action: AppsHoldingsReducerAction,
): AppsHoldingsReducerState => {
  switch (action.type) {
    case SET_APP_HOLDINGS:
    case UPDATE_APP_HOLDINGS:
      return {
        ...state,
        data: action.payload,
      };

    case SET_FETCHING_HOLDINGS:
      return {
        ...state,
        isFetching: action.payload,
      };

    default:
      return state;
  }
};

export default appsHoldingsReducer;
