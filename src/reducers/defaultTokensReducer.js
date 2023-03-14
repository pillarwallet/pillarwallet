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

import { FETCHING_DEFAULT_LIST, SET_STABLE_DEFAULT_LIST, SET_DEFAULT_LIST } from 'constants/assetsConstants';

// Utils
import NonStableTokens from 'utils/tokens/tokens.json';
import StableTokens from 'utils/tokens/stable-tokens.json';

// Models
import type { Asset } from 'models/Asset';

export type DefaultTokensReducerState = {
  tokens: Asset[],
  stableTokens: Asset[],
  isFetching: boolean,
};

export type TokensAction = {
  type: string,
  payload: any,
};

export const initialState = {
  tokens: NonStableTokens,
  stableTokens: StableTokens,
  isFetching: false,
};

export default function (state: DefaultTokensReducerState = initialState, action: TokensAction) {
  switch (action.type) {
    case SET_STABLE_DEFAULT_LIST:
      return { ...state, stableTokens: action.payload };

    case SET_DEFAULT_LIST:
      return { ...state, tokens: action.payload };

    case FETCHING_DEFAULT_LIST:
      return {
        ...state,
        isFetching: action.payload,
      };

    default:
      return state;
  }
}
