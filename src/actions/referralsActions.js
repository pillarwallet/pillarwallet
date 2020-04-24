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
import { format as formatDate } from 'date-fns';
import { NavigationActions } from 'react-navigation';

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type {
  ReferralsSendingInviteAction,
  ReferralContact,
  InviteSentPayload,
  ReferralsTokenReceived,
} from 'reducers/referralsReducer';

// constants
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import {
  SENDING_INVITE,
  INVITE_SENT,
  SET_CONTACTS_FOR_REFERRAL,
  REMOVE_CONTACT_FOR_REFERRAL,
  REFERRAL_INVITE_ERROR,
  ALLOW_ACCESS_PHONE_CONTACTS,
  CLAIM_REWARD,
  SET_ALREADY_INVITED_CONTACTS,
} from 'constants/referralsConstants';
import { ADD_EDIT_USER, APP_FLOW, REFER_FLOW } from 'constants/navigationConstants';

// components
import Toast from 'components/Toast';

// services
import { logEvent, getUserReferralLink } from 'services/branchIo';
import { navigate } from 'services/navigation';

export type ClaimTokenAction = {
  walletId: string,
  code: string,
};

export type ReferralInvitation = {|
  email?: string,
  phone?: string,
|};

let branchIoSubscription;

const referralsTokenReceivedAction = (
  token: string,
  email: ?string,
  phone: ?string,
): ReferralsTokenReceived => ({
  type: 'RECEIVED_REFERRAL_TOKEN',
  payload: {
    token,
    email,
    phone,
  },
});

const sendingInviteAction = (): ReferralsSendingInviteAction => ({
  type: SENDING_INVITE,
});

const inviteSentAction = (payload: InviteSentPayload) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: INVITE_SENT,
      payload,
    });
    dispatch({
      type: ADD_NOTIFICATION,
      payload: {
        message: 'Invitations sent',
        messageType: 'success',
      },
    });
  };
};


const inviteErrorAction = (errorMessage?: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: ADD_NOTIFICATION,
      payload: {
        message: errorMessage || 'Please try again later',
        title: 'Invites have not been sent',
        messageType: 'warning',
      },
    });
    dispatch({
      type: REFERRAL_INVITE_ERROR,
    });
  };
};

export const completeReferralsEventAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      user: { data: { walletId } },
      referrals: { referralToken, isRewardClaimed },
    } = getState();

    if (!referralToken || isRewardClaimed) {
      return;
    }

    await logEvent(BranchEvent.CompleteRegistration, {
      walletId,
      securityToken: referralToken,
    });

    dispatch({
      type: CLAIM_REWARD,
    });

    Toast.show({
      message: 'You are gonna receive your rewards soon!',
      type: 'info',
      title: 'Rewards on their way',
      autoClose: false,
    });
  };
};

export const sendReferralInvitationsAction = (invitationContacts: ReferralContact[]) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const walletId = get(getState(), 'user.data.walletId');
    const sentInvitationsCount = get(getState(), 'referrals.sentInvitationsCount');
    const { count, date } = sentInvitationsCount;
    dispatch(sendingInviteAction());

    const invitations = invitationContacts.map(({ email, phone }) => ({ email, phone }));

    await Promise.all(invitations.map(async (invitation) => {
      const { email, phone } = invitation;
      const token = await api.generateReferralToken(walletId);

      if (token.result !== 'success') {
        dispatch(inviteErrorAction());
        return;
      }

      const referralLink = await getUserReferralLink(walletId, {
        email,
        phone,
        token: token.token,
      });

      const { error } = await api.sendReferralInvitation({
        token: token.token,
        walletId,
        referralLink,
        email,
        phone,
      });

      if (error) {
        const errorMessage = get(error, 'response.data.message');
        dispatch(inviteErrorAction(errorMessage));
        return;
      }

      let updatedInvitationCount = count + invitationContacts.length;
      const currentDate = formatDate(new Date(), 'YYYY-MM-DD');
      if (date !== currentDate) {
        updatedInvitationCount = invitationContacts.length;
      }
      dispatch(inviteSentAction({
        alreadyInvitedContacts: invitationContacts,
        sentInvitationsCount: { count: updatedInvitationCount, date: currentDate },
      }));
    }));
  };
};

export const startReferralsListenerAction = () => {
  return (dispatch: Dispatch) => {
    if (branchIoSubscription) return;

    branchIoSubscription = branch.subscribe(({ error, params }) => {
      if (!isEmpty(error)) return;
      if (!params['+clicked_branch_link']) return;

      const { token, phone, email } = params;

      dispatch(referralsTokenReceivedAction(
        token,
        email,
        phone,
      ));
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

export const setContactsForReferralAction = (contacts: ReferralContact[]) => ({
  type: SET_CONTACTS_FOR_REFERRAL,
  payload: contacts,
});

export const removeContactForReferralAction = (id: string) => ({
  type: REMOVE_CONTACT_FOR_REFERRAL,
  payload: id,
});

export const allowToAccessPhoneContactsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: ALLOW_ACCESS_PHONE_CONTACTS,
    });
  };
};

export const goToInvitationFlowAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      user: { data: { isEmailVerified, isPhoneVerified } },
    } = getState();

    if (isEmailVerified || isPhoneVerified) {
      const navigateToReferFlow = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({ routeName: REFER_FLOW }),
      });
      navigate(navigateToReferFlow);
    } else {
      const navigateToUserSettings = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({ routeName: ADD_EDIT_USER }),
      });

      Toast.show({
        message: 'Please add and verify your email address or phone number to proceed',
        type: 'warning',
        title: 'Phone or Email verification needed',
        autoClose: false,
        onPress: () => navigate(navigateToUserSettings),
      });
    }
  };
};

export const fetchSentReferralInvitationsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
    } = getState();

    const sentInvitations = await api.getSentReferralInvites(walletId);

    dispatch({
      type: SET_ALREADY_INVITED_CONTACTS,
      payload: sentInvitations,
    });
  };
};
