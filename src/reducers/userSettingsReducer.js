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
import { SET_USER_SETTINGS, SET_HIDDEN_ASSETS } from 'constants/userSettingsConstants';

type HiddenAssetsByAccount = {
  [accountId: string]: string[],
}

type UserSettings = {
  hiddenAssets: HiddenAssetsByAccount;
}

export type UserSettingsReducerState = {
  data: UserSettings,
};

export type UserSettingsReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  data: {
    hiddenAssets: {},
  },
};

export default function userSettingsReducer(
  state: UserSettingsReducerState = initialState,
  action: UserSettingsReducerAction,
) {
  switch (action.type) {
    case SET_USER_SETTINGS:
      return { ...state, data: { ...state.data, ...action.payload } };
    case SET_HIDDEN_ASSETS:
      return { ...state, data: { ...state.data, hiddenAssets: action.payload } };
    default:
      return state;
  }
}
