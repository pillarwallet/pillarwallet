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

import { SET_STABLE_TOKEN } from 'constants/assetsConstants';

export type StableTokensReducerState = {
  data: any,
};

export type TokensAction = {
  type: string,
  payload: any,
};

export const initialState = {
  data: [],
};

export default function (state: StableTokensReducerState = initialState, action: TokensAction) {
  switch (action.type) {
    case SET_STABLE_TOKEN:
      return { ...state, data: action.payload };
    default:
      return state;
  }
}
