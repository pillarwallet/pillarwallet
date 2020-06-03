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
  DISMISS_SMART_WALLET_INSIGHT,
  DISMISS_PRIVACY_INSIGHT,
  DISMISS_VERIFICATION_NOTE,
  SET_INSIGHTS_STATE,
  DISMISS_REFER_FRIENDS_ON_HOME_SCREEN,
} from 'constants/insightsConstants';

export type InsightsReducerState = {
  SWInsightDismissed: boolean,
  privacyInsightDismissed: boolean,
  verificationNoteDismissed: boolean,
  referFriendsOnHomeScreenDismissed: boolean,
};

export type InsightsReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  SWInsightDismissed: false,
  privacyInsightDismissed: false,
  verificationNoteDismissed: false,
  referFriendsOnHomeScreenDismissed: false,
};

export default function insightsReducer(
  state: InsightsReducerState = initialState,
  action: InsightsReducerAction,
): InsightsReducerState {
  switch (action.type) {
    case DISMISS_SMART_WALLET_INSIGHT:
      return {
        ...state,
        SWInsightDismissed: true,
      };
    case DISMISS_PRIVACY_INSIGHT:
      return {
        ...state,
        privacyInsightDismissed: true,
      };
    case DISMISS_VERIFICATION_NOTE:
      return {
        ...state,
        verificationNoteDismissed: true,
      };
    case DISMISS_REFER_FRIENDS_ON_HOME_SCREEN:
      return {
        ...state,
        referFriendsOnHomeScreenDismissed: true,
      };
    case SET_INSIGHTS_STATE:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
