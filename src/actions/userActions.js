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
import { UPDATE_USER, REGISTERED, USER_PHONE_VERIFIED } from 'constants/userConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { logEventAction } from 'actions/analyticsActions';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { saveDbAction } from './dbActions';

export const updateUserAction = (walletId: string, field: Object, callback?: Function) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const response = await api.updateUser({ walletId, ...field });
    const { responseStatus, ...user } = response;

    if (responseStatus === 200) {
      const updatedUser = { ...user, lastUpdateTime: +new Date() };

      dispatch(saveDbAction('user', { user: updatedUser }, true));
      dispatch({
        type: UPDATE_USER,
        payload: { user: updatedUser, state: REGISTERED },
      });

      dispatch(logEventAction('user_profile_updated'));
      if (callback) callback();
    } else {
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Please try again later',
          title: 'Changes have not been saved',
          messageType: 'warning',
        },
      });
    }
  };
};

export const createOneTimePasswordAction = (walletId: string, field: Object, callback?: Function) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const response = await api.createOneTimePassword({ walletId, ...field });
    const { responseStatus } = response;

    if (responseStatus === 200) {
      dispatch(logEventAction('one_time_password_created'));

      if (callback) callback();
    } else {
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Please try again later',
          title: 'We can\'t verify your phone at this time',
          messageType: 'warning',
        },
      });
    }
  };
};

export type VerificationPhoneAction = {
  wallet: string,
  phone: string,
  oneTimePassword: string,
}

export const verifyPhoneAction = (props: VerificationPhoneAction, callback?: Function) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const response = await api.verifyPhone(props);
    const { responseStatus } = response;

    if (responseStatus === 200) {
      dispatch(logEventAction('phone_verified'));

      dispatch({ type: USER_PHONE_VERIFIED });
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Phone verification was successful',
          title: 'Validation successful',
          messageType: 'success',
        },
      });

      if (callback) callback();
    } else {
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Please try again later',
          title: 'We can\'t verify your phone at this time',
          messageType: 'warning',
        },
      });
    }
  };
};

export const updateUserAvatarAction = (walletId: string, formData: any) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
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

    dispatch(logEventAction('avatar_updated'));
  };
};

export const labelUserAsLegacyAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      oAuthTokens: { data: oAuthTokens },
      user: { data: user },
    } = getState();

    const userWallets = await api.getUserWallets(oAuthTokens.accessToken);
    if (!userWallets.length) return;

    const keyWallet = userWallets.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED) || {};
    const smartWallet = userWallets.find(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET) || {};

    const { createdAt: keyWalletCreationTime } = keyWallet;
    const { createdAt: smartWalletCreationTime } = smartWallet;

    const diff = keyWalletCreationTime && smartWalletCreationTime
      ? Math.floor((new Date(smartWalletCreationTime) - new Date(keyWalletCreationTime)) / 1000 / 60)
      : null;
    let isLegacyUser = true;

    // to those users who gets smart wallet created for them, key based and smart wallets are created one by one
    // in couple of minutes difference
    if (smartWalletCreationTime && diff && diff <= 5) {
      isLegacyUser = false;
    }

    dispatch({
      type: UPDATE_USER,
      payload: { user: { ...user, isLegacyUser }, state: REGISTERED },
    });
  };
};

