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
  INVITE_SENT,
  SENDING_INVITE,
} from 'constants/referralsConstants';

export type ReferralsReducerState = {
  isSendingInvite: boolean,
};

export type ReferralsSendingInviteAction = {|
  type: 'SENDING_INVITE',
|};

export type ReferralsInviteSentAction = {|
  type: 'INVITE_SENT',
|};

export type ReferralsReducerAction =
  | ReferralsSendingInviteAction
  | ReferralsInviteSentAction;

export const initialState = {
  isSendingInvite: false,
};

const ratesReducer = (
  state: ReferralsReducerState = initialState,
  action: ReferralsReducerAction,
): ReferralsReducerState => {
  switch (action.type) {
    case SENDING_INVITE:
      return { ...state, isSendingInvite: true };

    case INVITE_SENT:
      return { ...state, isSendingInvite: false };

    default:
      return state;
  }
};

export default ratesReducer;
