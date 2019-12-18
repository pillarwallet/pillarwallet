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
  INITIAL_FEATURE_FLAGS,
  SET_FEATURE_FLAGS,
  ENABLE_FEATURE_FLAG,
  DISABLE_FEATURE_FLAG,
} from 'constants/featureFlagsConstants';

export type FeatureFlagsReducerState = {|
  data: {
    [flag: string]: boolean,
  },
|};

export type FeatureFlagsReducerAction = {|
  type: string,
  payload: any,
|};

export const initialState = {
  data: INITIAL_FEATURE_FLAGS,
};

const featureFlagsReducer = (
  state: FeatureFlagsReducerState = initialState,
  action: FeatureFlagsReducerAction,
): FeatureFlagsReducerState => {
  switch (action.type) {
    case SET_FEATURE_FLAGS:
      return {
        ...state,
        data: action.payload,
      };
    case ENABLE_FEATURE_FLAG:
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload]: true,
        },
      };
    case DISABLE_FEATURE_FLAG:
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload]: false,
        },
      };
    default:
      return state;
  }
};

export default featureFlagsReducer;
