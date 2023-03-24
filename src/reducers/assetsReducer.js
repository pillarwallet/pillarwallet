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
import { SET_SUPPORTED_ASSETS, SET_CHAIN_SUPPORTED_ASSETS } from 'constants/assetsConstants';

// utils
import { sortAssetsArray, sortSupportedAssets } from 'utils/assets';

// types
import type { AssetsPerChain } from 'models/Asset';

export type AssetsReducerState = {
  supportedAssets: AssetsPerChain,
};

export type AssetsReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  supportedAssets: { ethereum: [] },
};

export default function assetsReducer(state: AssetsReducerState = initialState, action: AssetsReducerAction) {
  switch (action.type) {
    case SET_SUPPORTED_ASSETS:
      return {
        ...state,
        supportedAssets: sortSupportedAssets(action.payload),
      };

    case SET_CHAIN_SUPPORTED_ASSETS:
      const { chain, assets } = action.payload;
      return {
        ...state,
        supportedAssets: {
          ...state.supportedAssets,
          [chain]: sortAssetsArray(assets),
        },
      };

    default:
      return state;
  }
}
