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
import t from 'translations/translate';

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type {
  ReferralsSendingInviteAction,
  ReferralContact,
  InviteSentPayload,
  ReferralsTokenReceived,
  RewardsByCompany,
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
  SET_REFERRAL_REWARD_AMOUNT,
  SET_ALREADY_INVITED_CONTACTS,
  FETCHING_REFERRAL_REWARD_AMOUNT,
  SET_REFERRAL_REWARD_ISSUER_ADDRESSES,
  SET_PILLAR_REWARD_CAMPAIGN_STATUS,
  SET_1WORLD_CAMPAIGN_STATUS,
} from 'constants/referralsConstants';
import {
  APP_FLOW,
  REFER_FLOW,
  REFERRAL_SENT,
  REFERRAL_CONTACT_INFO_MISSING,
} from 'constants/navigationConstants';

// components
import Toast from 'components/Toast';

// services
import { logEvent, getUserReferralLink } from 'services/branchIo';
import { navigate } from 'services/navigation';

// utils
import { printLog, reportLog } from 'utils/common';


export type ClaimTokenAction = {
  walletId: string,
  code: string,
};

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
  };
};

const inviteErrorAction = (errorMessage?: string, isAllInvitesNotSent: boolean) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: ADD_NOTIFICATION,
      payload: {
        message: errorMessage || isAllInvitesNotSent
          ? t('toast.referralInviteCantBeSent.allInvites')
          : t('toast.referralInviteCantBeSent.notAllInvites'),
        emoji: 'hushed',
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
      user: { data: user },
      referrals: { referralToken, isRewardClaimed },
      session: { data: { isOnline } },
    } = getState();

    if (!referralToken || isRewardClaimed || !isOnline) {
      return;
    }

    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('completeReferralsEventAction failed: unable to get walletId', { user });
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
      message: t('toast.rewardsOnTheirWay'),
      emoji: 'tada',
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

    const unsentInvitations = [];
    let errorMessage;

    await Promise.all(invitations.map(async (invitation) => {
      const { email, phone } = invitation;
      const token = await api.generateReferralToken(walletId);

      if (token.result !== 'success') {
        unsentInvitations.push(invitation);
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
        errorMessage = get(error, 'response.data.message');
        unsentInvitations.push(invitation);
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
    if (unsentInvitations.length < invitations.length) {
      navigate(REFERRAL_SENT);
    }
    if (unsentInvitations.length) {
      dispatch(inviteErrorAction(errorMessage, unsentInvitations.length === invitations.length));
    }
  };
};

export const startReferralsListenerAction = () => {
  return (dispatch: Dispatch) => {
    if (branchIoSubscription) return;


    branchIoSubscription = branch.subscribe(({ error, params }) => {
      if (!isEmpty(error)) {
        // TODO: need to re-subscribe on fail
        printLog('Branch.io Subscribe error', error, 'error');
        return;
      }

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
          message: t('toast.cantVerifyCode'),
          emoji: 'hushed',
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
      navigate(REFERRAL_CONTACT_INFO_MISSING);
    }
  };
};

export const fetchSentReferralInvitationsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: user },
      session: { data: { isOnline } },
    } = getState();

    // cannot be done while offline
    if (!isOnline) return;

    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('fetchSentReferralInvitationsAction failed: unable to get walletId', { user });
      return;
    }

    const sentInvitations = await api.getSentReferralInvites(walletId);

    dispatch({
      type: SET_ALREADY_INVITED_CONTACTS,
      payload: sentInvitations,
    });
  };
};


export const fetchReferralRewardAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: user },
      referrals: { referralToken },
      session: { data: { isOnline } },
    } = getState();

    // cannot be done while offline
    if (!isOnline) return;

    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('fetchReferralRewardAction failed: unable to get walletId', { user });
      return;
    }

    dispatch({
      type: FETCHING_REFERRAL_REWARD_AMOUNT,
    });

    const referralCampaignsInfo = await api.getReferralCampaignsInfo(walletId, referralToken);
    const referralRewards: RewardsByCompany = Object.keys(referralCampaignsInfo)
      .reduce((rewardsByCampaign, campaignName) => {
        const isCampaignActive = get(referralCampaignsInfo, `[${campaignName}].isActive`);
        const campaignRewards = get(referralCampaignsInfo, `[${campaignName}].rewards`);
        if (campaignRewards && isCampaignActive) rewardsByCampaign[campaignName] = campaignRewards;
        return rewardsByCampaign;
      },
      {});

    dispatch({
      type: SET_REFERRAL_REWARD_AMOUNT,
      payload: referralRewards,
    });

    const isPillarRewardsActive = get(referralCampaignsInfo, 'pillar.isActive');
    const is1WorldCampaignActive = get(referralCampaignsInfo, '1world.isActive');

    dispatch({
      type: SET_PILLAR_REWARD_CAMPAIGN_STATUS,
      payload: isPillarRewardsActive,
    });

    dispatch({
      type: SET_1WORLD_CAMPAIGN_STATUS,
      payload: is1WorldCampaignActive,
    });
  };
};

export const fetchReferralRewardsIssuerAddressesAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: user },
      referrals: { referralToken },
      session: { data: { isOnline } },
    } = getState();

    // cannot be done while offline
    if (!isOnline) return;

    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('fetchReferralRewardsIssuerAddressesAction failed: unable to get walletId', { user });
      return;
    }

    const addresses = await api.getReferralRewardIssuerAddress(walletId, referralToken);

    dispatch({
      type: SET_REFERRAL_REWARD_ISSUER_ADDRESSES,
      payload: addresses,
    });
  };
};
