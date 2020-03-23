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
  PHONE_CONTACTS_RECEIVED,
  FETCHING_PHONE_CONTACTS,
} from 'constants/phoneContactsConstants';
import type { ReferralContact } from 'reducers/referralsReducer';


export type PhoneContactsReducerState = {
  data: ReferralContact[],
  isFetchComplete: boolean,
  isFetching: boolean,
};

export type PhoneContactsReceivedAction = {|
  type: 'PHONE_CONTACTS_RECEIVED',
  payload: ReferralContact[],
|};

export type FetchingPhoneContacts = {|
  type: 'FETCHING_PHONE_CONTACTS',
|};

export type PhoneContactsReducerAction =
  | FetchingPhoneContacts
  | PhoneContactsReceivedAction;

export const initialState: PhoneContactsReducerState = {
  data: [],
  isFetchComplete: false,
  isFetching: false,
};

const ratesReducer = (
  state: PhoneContactsReducerState = initialState,
  action: PhoneContactsReducerAction,
): PhoneContactsReducerState => {
  switch (action.type) {
    case PHONE_CONTACTS_RECEIVED:
      return {
        ...state,
        data: action.payload,
        isFetching: false,
        isFetchComplete: true,
      };

    case FETCHING_PHONE_CONTACTS:
      return {
        ...state,
        isFetching: true,
        isFetchComplete: false,
      };

    default:
      return state;
  }
};

export default ratesReducer;
