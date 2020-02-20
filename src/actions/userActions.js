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
  SENDING_OTP,
  OTP_SENT,
  RESET_OTP_STATUS,
  UPDATE_USER,
  REGISTERED,
  USER_PHONE_VERIFIED,
  USER_EMAIL_VERIFIED,
} from 'constants/userConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { logEventAction } from 'actions/analyticsActions';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import SDKWrapper from 'services/api';
import { saveDbAction } from './dbActions';

const sendingOneTimePasswordAction = () => ({
  type: SENDING_OTP,
});

const otpPasswordSentAction = () => ({
  type: OTP_SENT,
});

export const resetOneTimePasswordAction = () => ({
  type: RESET_OTP_STATUS,
});

export const updateUserAction = (walletId: string, field: Object, callback?: Function) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
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
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch(sendingOneTimePasswordAction());

    const response = await api.createOneTimePassword({ walletId, ...field });
    const { responseStatus } = response;

    if (responseStatus === 200) {
      dispatch(logEventAction('one_time_password_created'));

      if (callback) {
        callback();
      } else {
        dispatch(otpPasswordSentAction());
      }
    } else {
      dispatch(resetOneTimePasswordAction());
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

export const verifyEmailAction = (walletId: string, code: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch(sendingOneTimePasswordAction());

    const response = await api.verifyEmail({
      walletId,
      oneTimePassword: code,
    });

    const { responseStatus } = response;

    if (responseStatus === 200) {
      dispatch(logEventAction('email_verified'));

      dispatch({ type: USER_EMAIL_VERIFIED });
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Email verification was successful',
          title: 'Validation successful',
          messageType: 'success',
        },
      });
    } else {
      dispatch(otpPasswordSentAction());
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Please try again',
          title: 'We can\'t verify your email',
          messageType: 'warning',
        },
      });
    }
  };
};

export const verifyPhoneAction = (props: VerificationPhoneAction, callback?: Function) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
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
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
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
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: user },
    } = getState();

    const userWallets = await api.listAccounts(user.walletId);
    if (!userWallets.length) return;

    const keyWallet = userWallets.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
    const smartWallet = userWallets.find(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET);

    let isLegacyUser = true;

    if (keyWallet && smartWallet) {
      const { createdAt: keyWalletCreationTime } = keyWallet;
      const { createdAt: smartWalletCreationTime } = smartWallet;
      const diff = Math.floor((new Date(smartWalletCreationTime) - new Date(keyWalletCreationTime)) / 1000 / 60);
      // to those users who gets smart wallet created for them, key based and smart wallets are created one by one
      // in couple of minutes difference
      if (diff <= 5) {
        isLegacyUser = false;
      }
    }

    const updatedUser = {
      ...user,
      isLegacyUser,
    };

    dispatch({
      type: UPDATE_USER,
      payload: { user: updatedUser, state: REGISTERED },
    });

    dispatch(saveDbAction('user', { user: updatedUser }, true));
  };
};

