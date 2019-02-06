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
import { UPDATE_USER, REGISTERED } from 'constants/userConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { saveDbAction } from './dbActions';

export const updateUserAction = (walletId: string, field: Object, callback?: Function) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const response = await api.updateUser({ walletId, ...field });
    const { responseStatus, ...user } = response;

    if (responseStatus === 200) {
      const updatedUser = { ...user, lastUpdateTime: +new Date() };
      dispatch(saveDbAction('user', { user: updatedUser }, true));
      dispatch({
        type: UPDATE_USER,
        payload: { user: updatedUser, state: REGISTERED },
      });
      if (callback) callback();
    } else {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'Please try again later', title: 'Changes have not been saved', messageType: 'warning' },
      }));
    }
  };
};

export const updateUserAvatarAction = (walletId: string, formData: any) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: user } } = getState();

    const userAvatar = await api.updateUserAvatar(walletId, formData).catch(() => ({}));
    if (!Object.keys(userAvatar).length || !userAvatar.profileImage) return;

    const updatedUser = {
      ...user,
      profileImage: userAvatar.profileImage,
      lastUpdateTime: +new Date(),
    };
    dispatch(saveDbAction('user', { user: updatedUser }, true));

    dispatch({
      type: UPDATE_USER,
      payload: { user: updatedUser, state: REGISTERED },
    });
  };
};

