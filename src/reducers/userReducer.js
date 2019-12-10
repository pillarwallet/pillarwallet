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
import { UPDATE_USER, USER_PHONE_VERIFIED } from 'constants/userConstants';
import merge from 'lodash.merge';

export type UserReducerState = {
  data: Object,
  userState: ?string,
}

export type UserReducerAction = {
  type: string,
  payload: any
}

export const initialState = {
  data: {
    icoService: {},
    isLegacyUser: true,
  },
  userState: null,
};

const userReducer = (
  state: UserReducerState = initialState,
  action: UserReducerAction,
): UserReducerState => {
  switch (action.type) {
    case UPDATE_USER:
      const { state: userState, user } = action.payload;
      return {
        ...state,
        data: merge({}, { ...state.data }, user),
        userState,
      };
    case USER_PHONE_VERIFIED:
      return {
        ...state,
        data: merge({}, { ...state.data }, { isPhoneVerified: true }),
      };
    default:
      return state;
  }
};

export default userReducer;
