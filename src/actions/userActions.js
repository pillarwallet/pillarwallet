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
  VERIFICATION_FAILED,
  UPDATE_USER,
  REGISTERED,
  USER_PHONE_VERIFIED,
  USER_EMAIL_VERIFIED,
} from 'constants/userConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { logEventAction } from 'actions/analyticsActions';
import { completeReferralsEventAction } from 'actions/referralsActions';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';
import { saveDbAction } from './dbActions';

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
    title: 'Validation successful',
    messageType: 'success',
    autoClose: false,
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
          message: message || 'Please try again later',
          title: 'Changes have not been saved',
          messageType: 'warning',
        },
      });

      return;
    }

    const updatedUser = { ...user, lastUpdateTime: +new Date() };

    dispatch(saveDbAction('user', { user: updatedUser }, true));
    dispatch({
      type: UPDATE_USER,
      payload: { user: updatedUser, state: REGISTERED },
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

    const response = await api.createOneTimePassword({ walletId, ...field });
    const { responseStatus } = response;

    if (responseStatus === 200) {
      dispatch(logEventAction('one_time_password_created'));

      dispatch(oneTimePasswordSentAction());
      if (callback) callback();
    } else {
      dispatch(resetOneTimePasswordAction());
      const fieldName = field.smsNotification ? 'phone' : 'email';
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Please try again later',
          title: `We can't verify your ${fieldName} at this time`,
          messageType: 'warning',
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

    let message = 'Email verification was successful';

    if ((isPillarRewardCampaignActive || is1WorldCampaignActive)
      && referralToken && !isRewardClaimed && referredEmail === email) {
      dispatch(completeReferralsEventAction());
      message = 'Thank you for verifying your information, ' +
                'we are currently processing your reward.';
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

    let message = 'Phone verification was successful';

    if ((isPillarRewardCampaignActive || is1WorldCampaignActive)
      && referralToken && !isRewardClaimed && referredPhone === phone) {
      dispatch(completeReferralsEventAction());
      message = 'Thank you for verifying your information, ' +
                'we are currently processing your reward.';
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

