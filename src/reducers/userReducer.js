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
  UPDATE_USER,
  USER_PHONE_VERIFIED,
  USER_EMAIL_VERIFIED,
  SENDING_OTP,
  OTP_SENT,
  RESET_OTP_STATUS,
} from 'constants/userConstants';
import merge from 'lodash.merge';

export type UserReducerState = {
  data: {
    id?: string,
    username?: string,
    sendingOneTimePassword: boolean,
    oneTimePasswordSent: boolean,
    icoService: Object,
    isLegacyUser: boolean,
    walletId: string,
    email?: string,
    isPhoneVerified: boolean,
    isEmailVerified: boolean,
  },
  userState: ?string,
}

export type UserReducerAction = {
  type: string,
  payload: any
}

export const initialState: UserReducerState = {
  data: {
    sendingOneTimePassword: false,
    oneTimePasswordSent: false,
    icoService: {},
    isLegacyUser: true,
    walletId: '',
    isEmailVerified: false,
    isPhoneVerified: false,
  },
  userState: null,
};

const userReducer = (
  state: UserReducerState = initialState,
  action: UserReducerAction,
): UserReducerState => {
  const { data } = state;

  switch (action.type) {
    case SENDING_OTP:
      return {
        ...state,
        data: merge({}, { ...data }, {
          sendingOneTimePassword: true,
          oneTimePasswordSent: false,
        }),
      };

    case OTP_SENT:
      return {
        ...state,
        data: merge({}, { ...data }, {
          sendingOneTimePassword: false,
          oneTimePasswordSent: true,
        }),
      };

    case RESET_OTP_STATUS:
      return {
        ...state,
        data: merge({}, { ...data }, {
          sendingOneTimePassword: false,
          oneTimePasswordSent: false,
        }),
      };

    case UPDATE_USER:
      const { state: userState, user } = action.payload;
      return {
        ...state,
        data: merge({}, { ...data }, user),
        userState,
      };

    case USER_EMAIL_VERIFIED:
      return {
        ...state,
        data: merge({}, { ...data }, {
          sendingOneTimePassword: false,
          oneTimePasswordSent: false,
          isEmailVerified: true,
        }),
      };

    case USER_PHONE_VERIFIED:
      return {
        ...state,
        data: merge({}, { ...data }, {
          sendingOneTimePassword: false,
          oneTimePasswordSent: false,
          isPhoneVerified: true,
        }),
      };

    default:
      return state;
  }
};

export default userReducer;
