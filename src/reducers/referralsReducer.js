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

import { ADD_CONTACTS_FOR_REFERRAL, REMOVE_CONTACT_FOR_REFERRAL } from 'constants/referralConstants';

export type ReferralContact = {
  id: string,
  name: string,
  email?: string,
  phone?: string,
  photo?: string,
};

export type ReferralsReducerState = {
  addedContactsToInvite: ReferralContact[],
};

export type ReferralsReducerAction = {
  type: string,
  payload: any
};

const initialState = {
  addedContactsToInvite: [],
};

export default function referralsReducer(
  state: ReferralsReducerState = initialState,
  action: ReferralsReducerAction,
) {
  switch (action.type) {
    case ADD_CONTACTS_FOR_REFERRAL:
      return { ...state, addedContactsToInvite: [...state.addedContactsToInvite, ...action.payload] };
    case REMOVE_CONTACT_FOR_REFERRAL:
      return {
        ...state,
        addedContactsToInvite: [...state.addedContactsToInvite.filter((contact) => contact.id !== action.payload)],
      };
    default:
      return state;
  }
}
