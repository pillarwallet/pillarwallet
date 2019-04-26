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
import { ADD_NOTIFICATION } from 'constants/notificationConstants';

export type ClaimTokenAction = {
  walletId: string,
  code: string,
}

export const claimTokensAction = (props: ClaimTokenAction, callback?: Function) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const response = await api.claimTokens(props);
    const { responseStatus } = response;

    if (responseStatus === 200 && callback) {
      callback();
    } else {
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Please try again later',
          title: 'We can\'t verify your code at this time',
          messageType: 'warning',
        },
      });
    }
  };
};
