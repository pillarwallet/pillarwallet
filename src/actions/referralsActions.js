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
import branch, { BranchEvent } from 'react-native-branch';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

// constants
import { ADD_NOTIFICATION } from 'constants/notificationConstants';

// services
import { logEvent, getUserReferralLink } from 'services/branchIo';

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export type ClaimTokenAction = {
  walletId: string,
  code: string,
};

let branchIoSubscription;

export const completeRefferalsEventAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const walletId = get(getState(), 'user.data.walletId');
    await logEvent(BranchEvent.CompleteRegistration, { walletId });
  };
};

export const inviteByEmailAction = (email: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const walletId = get(getState(), 'user.data.walletId');
    // TODO: get security token from back-end and attach when creating link
    const inviteSecurityToken = 'inviteSecurityToken';
    const inviteLink = await getUserReferralLink(walletId, { email, token: inviteSecurityToken });
    console.log('inviteLink: ', inviteLink);
    // TODO: send invite link to back-end
  };
};

export const startReferralsListenerAction = () => {
  return () => {
    if (branchIoSubscription) return;
    branchIoSubscription = branch.subscribe(({ error, params }) => {
      if (!isEmpty(error)) return;
      console.log('params: ', params);
      // TODO: check if referred install and show appropriate front-end flow
    });
  };
};

export const stopReferralsListenerAction = () => {
  return async () => {
    if (!branchIoSubscription) return;
    // per Branch.io docs – branch.subscribe returns a function that cancels subscription once called
    branchIoSubscription();
    branchIoSubscription = null;
  };
};

// TODO: old one?
export const claimTokensAction = (props: ClaimTokenAction, callback?: Function) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const response = await api.claimTokens(props);
    const { responseStatus } = response;

    if (responseStatus === 200) {
      if (callback) callback({ error: false });
    } else {
      if (callback) callback({ error: true });
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
