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

import t from 'translations/translate';
import omit from 'lodash.omit';

// constants
import {
  SENDING_OTP,
  OTP_SENT,
  RESET_OTP_STATUS,
  VERIFICATION_FAILED,
  UPDATE_USER,
  USER_PHONE_VERIFIED,
  USER_EMAIL_VERIFIED,
  SET_USER,
} from 'constants/userConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { OTP_DIGITS } from 'constants/referralsConstants';

// utils
import { isCaseInsensitiveMatch, reportLog } from 'utils/common';

// actions
import { saveDbAction } from 'actions/dbActions';
import { logEventAction } from 'actions/analyticsActions';
import { completeReferralsEventAction } from 'actions/referralsActions';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';


const sendingOneTimePasswordAction = () => ({
  type: SENDING_OTP,
});

const verificationFailedAction = () => ({
  type: VERIFICATION_FAILED,
});

const verificationSucceededAction = (message: string) => ({
  type: ADD_NOTIFICATION,
  payload: {
    message,
    emoji: 'ok_hand',
  },
});

const oneTimePasswordSentAction = () => ({
  type: OTP_SENT,
});

export const resetOneTimePasswordAction = () => ({
  type: RESET_OTP_STATUS,
});

export const updateUserAction = (walletId: string, field: Object, callback?: Function) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const response = await api.updateUser({ walletId, ...field });
    const { responseStatus, message, ...user } = response;

    if (responseStatus !== 200) {
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: message || t('toast.cantUpdateUser'),
          emoji: 'hushed',
        },
      });

      return;
    }

    const updatedUser = { ...user, lastUpdateTime: +new Date() };

    dispatch(saveDbAction('user', { user: updatedUser }, true));
    dispatch({
      type: UPDATE_USER,
      payload: updatedUser,
    });

    dispatch(logEventAction('user_profile_updated'));
    if (callback) callback();
  };
};

export const createOneTimePasswordAction = (
  walletId: string,
  field: Object,
  callback?: () => void, // TODO: remove this callback
) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch(sendingOneTimePasswordAction());

    const response = await api.createOneTimePassword({ walletId, digits: OTP_DIGITS, ...field });
    const { responseStatus } = response;

    if (responseStatus === 200) {
      dispatch(logEventAction('one_time_password_created'));

      dispatch(oneTimePasswordSentAction());
      if (callback) callback();
    } else {
      dispatch(resetOneTimePasswordAction());
      const fieldName = field.smsNotification ? 'phone' : 'email'; // eslint-disable-line i18next/no-literal-string
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: t([`toast.cantVerifyInfo.${fieldName}`, 'toast.cantVerifyInfo.default']),
          emoji: 'hushed',
        },
      });
    }
  };
};

export const verifyEmailAction = (walletId: string, code: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch(sendingOneTimePasswordAction());

    const response = await api.verifyEmail({
      walletId,
      oneTimePassword: code,
    });

    const { responseStatus } = response;

    if (responseStatus !== 200) {
      dispatch(verificationFailedAction());
      return;
    }

    dispatch(logEventAction('email_verified'));
    dispatch({ type: USER_EMAIL_VERIFIED });

    const {
      referrals: {
        referralToken,
        isRewardClaimed,
        referredEmail,
        isPillarRewardCampaignActive,
        is1WorldCampaignActive,
      },
      user: {
        data: { email },
      },
    } = getState();

    let message = t('toast.verificationSuccess.email');

    if ((isPillarRewardCampaignActive || is1WorldCampaignActive)
      && referralToken && !isRewardClaimed && isCaseInsensitiveMatch(email, referredEmail)) {
      dispatch(completeReferralsEventAction());
      message = t('toast.verificationSuccess.referralReward');
    }

    dispatch(verificationSucceededAction(message));
  };
};

export const verifyPhoneAction = (
  walletId: string,
  code: string,
  // FIXME: remove callback.
  // Callback is being used on screens/OTP/OTP
  callback?: () => void,
) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch(sendingOneTimePasswordAction());

    const response = await api.verifyPhone({
      walletId,
      oneTimePassword: code,
    });

    const { responseStatus } = response;

    if (responseStatus !== 200) {
      dispatch(verificationFailedAction());
      return;
    }

    dispatch(logEventAction('phone_verified'));
    dispatch({ type: USER_PHONE_VERIFIED });

    const {
      referrals: {
        referralToken,
        isRewardClaimed,
        referredPhone,
        isPillarRewardCampaignActive,
        is1WorldCampaignActive,
      },
      user: {
        data: { phone },
      },
    } = getState();

    let message = t('toast.verificationSuccess.phone');

    if ((isPillarRewardCampaignActive || is1WorldCampaignActive)
      && referralToken && !isRewardClaimed && referredPhone === phone) {
      dispatch(completeReferralsEventAction());
      message = t('toast.verificationSuccess.referralReward');
    }

    dispatch(verificationSucceededAction(message));

    if (callback) callback();
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
      payload: updatedUser,
    });

    dispatch(logEventAction('avatar_updated'));
  };
};

export const deleteUserAvatarAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const user = getState().user.data;

    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('deleteUserAvatarAction failed: unable to get walletId', { user });
      return;
    }

    const success = await api.deleteUserAvatar(walletId);

    if (success) {
      const updatedUser = {
        ...omit(user, 'profileImage'), // eslint-disable-line i18next/no-literal-string
        lastUpdateTime: +new Date(),
      };

      dispatch(saveDbAction('user', { user: updatedUser }, true));
      dispatch({ type: SET_USER, payload: updatedUser });
    } else {
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: t('toast.failedToDeleteAvatar'),
          emoji: 'hushed',
        },
      });
    }
  };
};
