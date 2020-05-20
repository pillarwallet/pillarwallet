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
  SET_CONTACTS_FOR_REFERRAL,
  REMOVE_CONTACT_FOR_REFERRAL,
  INVITE_SENT,
  SENDING_INVITE,
  REFERRAL_INVITE_ERROR,
  SET_ALREADY_INVITED_CONTACTS,
  ALLOW_ACCESS_PHONE_CONTACTS,
  RECEIVED_REFERRAL_TOKEN,
  CLAIM_REWARD,
  SET_REFERRAL_REWARD_AMOUNT,
  FETCHING_REFERRAL_REWARD_AMOUNT,
  SET_REFERRAL_REWARD_ISSUER_ADDRESSES,
  SET_PILLAR_REWARD_CAMPAIGN_STATUS,
} from 'constants/referralsConstants';

export type SentInvitationsCount = {
  count: number,
  date: string,
};

export type ReferralContact = {|
  id: string,
  name: string,
  email?: string,
  phone?: string,
  photo?: string,
|};

export type ReferralReward = {
  asset: string,
  amount: number,
};

export type RewardsByCompany = {
  [campaignName: string]: ReferralReward,
};

export type InviteSentPayload = {
  alreadyInvitedContacts: ReferralContact[],
  sentInvitationsCount: SentInvitationsCount,
};

export type ReferralRewardsIssuersAddresses = string[];

type ReferralsAllowPhoneContactsAccess = {|
  type: 'ALLOW_ACCESS_PHONE_CONTACTS',
|};

export type ReferralsSendingInviteAction = {|
  type: 'SENDING_INVITE',
|};

export type ReferralsInviteSentAction = {|
  type: 'INVITE_SENT',
  payload: InviteSentPayload,
|};

export type ReferralsErrorErrorAction = {|
  type: 'REFERRAL_INVITE_ERROR',
|};

type ReferralsSetContactsAction = {|
  type: 'SET_CONTACTS_FOR_REFERRAL',
  payload: ReferralContact[],
|};

export type ReferralsRemoveContactAction = {|
  type: 'REMOVE_CONTACT_FOR_REFERRAL',
  payload: string,
|};

export type ReferralsInviteAlreadySentAction = {|
  type: 'SET_ALREADY_INVITED_CONTACTS',
  payload: ReferralContact[],
|};

export type ReferralsTokenReceived = {|
  type: 'RECEIVED_REFERRAL_TOKEN',
  payload: {|
    token: string,
    email: ?string,
    phone: ?string,
  |},
|};

type ReferralsClaimReward = {|
  type: 'CLAIM_REWARD',
|};


export type ReferralsReducerAction =
  | ReferralsSendingInviteAction
  | ReferralsInviteSentAction
  | ReferralsSetContactsAction
  | ReferralsRemoveContactAction
  | ReferralsErrorErrorAction
  | ReferralsInviteAlreadySentAction
  | ReferralsTokenReceived
  | ReferralsClaimReward
  | ReferralsAllowPhoneContactsAccess;

export type ReferralsReducerState = {|
  isSendingInvite: boolean,
  addedContactsToInvite: ReferralContact[],
  alreadyInvitedContacts: ReferralContact[],
  hasAllowedToAccessContacts: boolean,
  sentInvitationsCount: SentInvitationsCount,
  referralToken: ?string,
  referredEmail: ?string,
  referredPhone: ?string,
  isRewardClaimed: boolean,
  rewards: RewardsByCompany,
  isFetchingRewards: boolean,
  referralRewardIssuersAddresses: ReferralRewardsIssuersAddresses,
  isPillarRewardCampaignActive: boolean,
|};

export const initialState: ReferralsReducerState = {
  addedContactsToInvite: [],
  alreadyInvitedContacts: [],
  isSendingInvite: false,
  hasAllowedToAccessContacts: false,
  sentInvitationsCount: {
    count: 0,
    date: '',
  },
  referralToken: null,
  referredEmail: null,
  referredPhone: null,
  isRewardClaimed: false,
  rewards: {},
  isFetchingRewards: false,
  referralRewardIssuersAddresses: [],
  isPillarRewardCampaignActive: false,
};


const setContacts = (
  state: ReferralsReducerState,
  action: ReferralsSetContactsAction,
): ReferralsReducerState => {
  const { payload } = action;

  return {
    ...state,
    addedContactsToInvite: payload,
  };
};

const removeContact = (
  state: ReferralsReducerState,
  action: ReferralsRemoveContactAction,
): ReferralsReducerState => {
  const { payload } = action;
  const { addedContactsToInvite } = state;

  return {
    ...state,
    addedContactsToInvite: [...addedContactsToInvite.filter((contact) => contact.id !== payload)],
  };
};

const setInvitations = (
  state: ReferralsReducerState,
  action: ReferralsInviteSentAction,
): ReferralsReducerState => {
  const { payload } = action;
  const { alreadyInvitedContacts: _alreadyInvitedContacts, sentInvitationsCount } = payload;
  const { alreadyInvitedContacts } = state;

  return {
    ...state,
    isSendingInvite: false,
    addedContactsToInvite: [],
    alreadyInvitedContacts: [...alreadyInvitedContacts, ..._alreadyInvitedContacts],
    sentInvitationsCount,
  };
};

const setAlreadySentInvites = (
  state: ReferralsReducerState,
  action: ReferralsInviteAlreadySentAction,
): ReferralsReducerState => {
  const { payload } = action;
  return { ...state, alreadyInvitedContacts: payload };
};

export default function referralsReducer(
  state: ReferralsReducerState = initialState,
  action: ReferralsReducerAction,
): ReferralsReducerState {
  switch (action.type) {
    case SENDING_INVITE:
      return { ...state, isSendingInvite: true };

    case INVITE_SENT:
      return setInvitations(state, action);

    case REFERRAL_INVITE_ERROR:
      return { ...state, isSendingInvite: false };

    case SET_ALREADY_INVITED_CONTACTS:
      return setAlreadySentInvites(state, action);

    case SET_CONTACTS_FOR_REFERRAL:
      return setContacts(state, action);

    case REMOVE_CONTACT_FOR_REFERRAL:
      return removeContact(state, action);

    case ALLOW_ACCESS_PHONE_CONTACTS:
      return { ...state, hasAllowedToAccessContacts: true };

    case RECEIVED_REFERRAL_TOKEN:
      const { payload: { token, email, phone } } = action;

      return {
        ...state,
        isRewardClaimed: false,
        referralToken: token,
        referredEmail: email,
        referredPhone: phone,
      };

    case CLAIM_REWARD:
      return { ...state, isRewardClaimed: true };

    case FETCHING_REFERRAL_REWARD_AMOUNT:
      return { ...state, isFetchingRewards: true };

    case SET_REFERRAL_REWARD_AMOUNT:
      return { ...state, rewards: { ...state.rewards, ...action.payload }, isFetchingRewards: false };

    case SET_REFERRAL_REWARD_ISSUER_ADDRESSES:
      return { ...state, referralRewardIssuersAddresses: action.payload };

    case SET_PILLAR_REWARD_CAMPAIGN_STATUS:
      return { ...state, isPillarRewardCampaignActive: action.payload };

    default:
      return state;
  }
}
