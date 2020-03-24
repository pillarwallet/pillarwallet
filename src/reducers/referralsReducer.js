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
} from 'constants/referralsConstants';

export type ReferralContact = {
  id: string,
  name: string,
  email?: string,
  phone?: string,
  photo?: string,
};

export type ReferralsSendingInviteAction = {|
  type: 'SENDING_INVITE',
|};

export type ReferralsInviteSentAction = {|
  type: 'INVITE_SENT',
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

export type ReferralsReducerAction =
  | ReferralsSendingInviteAction
  | ReferralsInviteSentAction
  | ReferralsSetContactsAction
  | ReferralsRemoveContactAction
  | ReferralsErrorErrorAction;

export type ReferralsReducerState = {
  isSendingInvite: boolean,
  addedContactsToInvite: ReferralContact[],
};

export const initialState = {
  addedContactsToInvite: [],
  isSendingInvite: false,
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


export default function referralsReducer(
  state: ReferralsReducerState = initialState,
  action: ReferralsReducerAction,
): ReferralsReducerState {
  switch (action.type) {
    case SENDING_INVITE:
      return { ...state, isSendingInvite: true };

    case INVITE_SENT:
      return { ...state, isSendingInvite: false, addedContactsToInvite: [] };

    case REFERRAL_INVITE_ERROR:
      return { ...state, isSendingInvite: false };

    case SET_CONTACTS_FOR_REFERRAL:
      return setContacts(state, action);

    case REMOVE_CONTACT_FOR_REFERRAL:
      return removeContact(state, action);

    default:
      return state;
  }
}
