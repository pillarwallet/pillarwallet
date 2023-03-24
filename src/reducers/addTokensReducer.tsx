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
import { ADD_TOKENS_FETCHING, ADD_TOKENS_LIST, IS_ADD_TOKENS_FETCHED } from 'constants/assetsConstants';

// Modals
import type { AddTokens } from 'models/Asset';

export type AddTokensReducerState = {
  addTokensList: AddTokens[];
  isFetching: boolean;
  isFetched: boolean;
};

export type AddTokensReducerAction = {
  type: string;
  payload: any;
};

export const initialState = {
  addTokensList: [],
  isFetching: false,
  isFetched: false,
};

export default function addTokensReducer(state: AddTokensReducerState = initialState, action: AddTokensReducerAction) {
  switch (action.type) {
    case ADD_TOKENS_FETCHING:
      return {
        ...state,
        isFetching: action.payload,
      };

    case ADD_TOKENS_LIST:
      return {
        ...state,
        addTokensList: action.payload,
      };

    case IS_ADD_TOKENS_FETCHED:
      return {
        ...state,
        isFetched: action.payload,
      };

    default:
      return state;
  }
}
