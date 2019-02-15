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

import { UPDATE_COLLECTIBLES } from 'constants/collectiblesConstants';

export type CollectiblesReducerState = {
  assets: Object[],
  categories: Object[],
};

export type CollectiblesReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  assets: [],
  categories: [],
};

export default function assetsReducer(
  state: CollectiblesReducerState = initialState,
  action: CollectiblesReducerAction,
) {
  switch (action.type) {
    case UPDATE_COLLECTIBLES:
      return {
        ...state,
        assets: action.payload.assets || [],
        categories: action.payload.categories || [],
      };
    default:
      return state;
  }
}
