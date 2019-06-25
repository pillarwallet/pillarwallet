// @flow
import {
  UPDATE_BADGES,
  ADD_CONTACT_BADGES,
  SET_CONTACTS_BADGES,
  FETCHING_CONTACTS_BADGES,
  STOP_FETCHING_CONTACTS_BADGES,
} from 'constants/badgesConstants';
import type { Badges } from 'models/Badge';
import merge from 'lodash.merge';

export type BadgesReducerState = {
  data: Badges,
};

export type BadgesReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: [],
  contactsBadges: {},
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
    default:
      return state;
  }
}
