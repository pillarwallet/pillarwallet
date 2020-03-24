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

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type {
  ReferralsSendingInviteAction,
  ReferralContact,
} from 'reducers/referralsReducer';

// constants
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import {
  SENDING_INVITE,
  INVITE_SENT,
  SET_CONTACTS_FOR_REFERRAL,
  REMOVE_CONTACT_FOR_REFERRAL,
  REFERRAL_INVITE_ERROR,
} from 'constants/referralsConstants';

// services
import { logEvent, getUserReferralLink } from 'services/branchIo';


export type ClaimTokenAction = {
  walletId: string,
  code: string,
};

export type ReferralInvitation = {|
  email?: string,
  phone?: string,
|};

let branchIoSubscription;

const sendingInviteAction = (): ReferralsSendingInviteAction => ({
  type: SENDING_INVITE,
});

const inviteSentAction = (dispatch) => {
  dispatch({
    type: INVITE_SENT,
  });
  dispatch({
    type: ADD_NOTIFICATION,
    payload: {
      message: 'Invitations sent',
      messageType: 'success',
    },
  });
};

const inviteErrorAction = (dispatch) => {
  dispatch({
    type: ADD_NOTIFICATION,
    payload: {
      message: 'Please try again later',
      title: 'Invites have not been sent',
      messageType: 'warning',
    },
  });
  dispatch({
    type: REFERRAL_INVITE_ERROR,
  });
};

export const completeRefferalsEventAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const walletId = get(getState(), 'user.data.walletId');
    await logEvent(BranchEvent.CompleteRegistration, { walletId });
  };
};

export const sendReferralInvitationsAction = (invitations: ReferralInvitation[]) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const walletId = get(getState(), 'user.data.walletId');
    dispatch(sendingInviteAction());

    await Promise.all(invitations.map(async (invitation) => {
      const { email, phone } = invitation;
      const token = await api.generateReferralToken(walletId);

      if (token.result === 'success') {
        const referralLink = await getUserReferralLink(walletId, {
          email,
          phone,
          token: token.token,
        });

        const referralInvitationStatus = await api.sendReferralInvitation({
          token: token.token,
          walletId,
          referralLink,
          email,
          phone,
        });
        if (referralInvitationStatus.error) {
          inviteErrorAction(dispatch);
        } else {
          inviteSentAction(dispatch);
        }
      } else {
        inviteErrorAction(dispatch);
      }
    }));
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

export const setContactsForReferralAction = (contacts: ReferralContact[]) => {
  return (dispatch: Dispatch) => {
    dispatch({
      type: SET_CONTACTS_FOR_REFERRAL,
      payload: contacts,
    });
  };
};

export const removeContactForReferralAction = (id: string) => {
  return (dispatch: Dispatch) => {
    dispatch({
      type: REMOVE_CONTACT_FOR_REFERRAL,
      payload: id,
    });
  };
};
