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

import merge from 'lodash.merge';
import {
  UPDATE_BADGES,
  ADD_CONTACT_BADGES,
  SET_CONTACTS_BADGES,
  FETCHING_CONTACTS_BADGES,
  STOP_FETCHING_CONTACTS_BADGES,
  SET_BADGE_AWARD_EVENTS,
} from 'constants/badgesConstants';
import type { Badges, BadgeRewardEvent } from 'models/Badge';

export type BadgesReducerState = {
  data: Badges,
  contactsBadges: {
    [contactId: string]: Badges,
  },
  isFetchingBadges: boolean,
  badgesEvents: BadgeRewardEvent[],
};

export type BadgesReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: [],
  contactsBadges: {},
  badgesEvents: [],
  isFetchingBadges: false,
};

export default function badgesReducer(
  state: BadgesReducerState = initialState,
  action: BadgesReducerAction,
) {
  switch (action.type) {
    case UPDATE_BADGES:
      return {
        ...state,
        data: action.payload,
      };
    case FETCHING_CONTACTS_BADGES:
      return {
        ...state,
        isFetchingBadges: true,
      };
    case STOP_FETCHING_CONTACTS_BADGES:
      return {
        ...state,
        isFetchingBadges: false,
      };
    case ADD_CONTACT_BADGES:
      const { username, badges } = action.payload;
      return merge(
        {},
        state,
        {
          contactsBadges: {
            [username]: badges,
          },
          isFetchingBadges: false,
        },
      );
    case SET_CONTACTS_BADGES:
      return {
        ...state,
        contactsBadges: action.payload,
        isFetchingBadges: false,
      };
    case SET_BADGE_AWARD_EVENTS:
      return {
        ...state,
        badgesEvents: action.payload,
      };
    default:
      return state;
  }
}
