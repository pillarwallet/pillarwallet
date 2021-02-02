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
  GET_OCEAN_DATA_SETS_ERROR,
  GET_OCEAN_DATA_SETS,
  GET_OCEAN_DATA_SETS_START,
} from 'constants/oceanMarketConstants';


export type OceanMarketReducerState = {
  dataSets: [],
  isFetching: boolean,
};

export type OceanMarketReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  dataSets: [],
  isFetching: false,
};

export default function lendingReducer(
  state: OceanMarketReducerState = initialState,
  action: OceanMarketReducerAction,
): OceanMarketReducerState {
  switch (action.type) {
    case GET_OCEAN_DATA_SETS_START: {
      return {
        ...state,
        isFetching: true,
      };
    }

    case GET_OCEAN_DATA_SETS: {
      return {
        ...state,
        isFetching: false,
        dataSets: action.payload.dataSets,
      };
    }

    case GET_OCEAN_DATA_SETS_ERROR: {
      return {
        ...state,
        isFetching: false,
        dataSets: [],
      };
    }

    default: {
      return state;
    }
  }
}
