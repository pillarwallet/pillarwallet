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
import {
  UPDATE_ASSET,
  UPDATE_ASSETS,
  UPDATE_ASSETS_STATE,
  SET_INITIAL_ASSETS,
  FETCHING,
  FETCHED,
  FETCHED_INITIAL,
  UPDATE_SUPPORTED_ASSETS,
  UPDATE_ASSETS_SEARCH_RESULT,
  START_ASSETS_SEARCH,
  RESET_ASSETS_SEARCH_RESULT,
} from 'constants/assetsConstants';
import merge from 'lodash.merge';
import { sortAssetsArray } from 'utils/assets';

import type { Asset, AssetsByAccount } from 'models/Asset';

export type AssetsReducerState = {
  data: AssetsByAccount,
  supportedAssets: Asset[],
  assetsState: ?string,
};

export type AssetsReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  data: {},
  supportedAssets: [],
  assetsState: null,
  assetsSearchResults: [],
};

export default function assetsReducer(
  state: AssetsReducerState = initialState,
  action: AssetsReducerAction,
) {
  switch (action.type) {
    case UPDATE_ASSETS_STATE:
      return { ...state, assetsState: action.payload };

    case UPDATE_ASSET:
      const { symbol } = action.payload;
      const updatedState = {
        data: { [symbol]: { ...state.data[symbol], ...action.payload } },
      };
      return merge(
        {},
        state,
        updatedState,
      );

    case UPDATE_SUPPORTED_ASSETS:
      return { ...state, supportedAssets: sortAssetsArray(action.payload) };

    case UPDATE_ASSETS:
      const assetsState = Object.keys(action.payload).length ? FETCHED : initialState.assetsState;
      return { ...state, data: action.payload || {}, assetsState };

    case SET_INITIAL_ASSETS:
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload.accountId]: action.payload.assets || {},
        },
        assetsState: FETCHED_INITIAL,
      };

    case START_ASSETS_SEARCH:
      return {
        ...state,
        assetsSearchState: FETCHING,
        assetsSearchResults: [],
      };

    case UPDATE_ASSETS_SEARCH_RESULT:
      return {
        ...state,
        assetsSearchState: FETCHED,
        assetsSearchResults: action.payload,
      };

    case RESET_ASSETS_SEARCH_RESULT:
      return {
        ...state,
        assetsSearchState: null,
        assetsSearchResults: [],
      };

    default:
      return state;
  }
}
