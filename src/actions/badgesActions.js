// @flow
import isEmpty from 'lodash.isempty';
import {
  UPDATE_BADGES,
  ADD_CONTACT_BADGES,
  FETCHING_CONTACTS_BADGES,
  STOP_FETCHING_CONTACTS_BADGES,
  BADGE_REWARD_EVENT,
  SET_BADGE_AWARD_EVENTS,
} from 'constants/badgesConstants';
import Toast from 'components/Toast';
import SDKWrapper from 'services/api';

import type { Dispatch, GetState } from 'reducers/rootReducer';

import { saveDbAction } from './dbActions';
import { offlineApiCall } from './offlineApiActions';

export const fetchBadgesAction = (notifyOnNewBadge: boolean = true) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      badges: { data: badges },
    } = getState();

    let newBadgeReceived = false;
    const userBadges = await api.fetchBadges(walletId);

    if (!isEmpty(userBadges)) {
      const updatedBadges = userBadges.map(badge => {
        const badgeId = badge.id;
        const oldBadgeInfo = badges.find(({ id }) => id === badgeId);
        if (!oldBadgeInfo) newBadgeReceived = true;
        const badgeInfo = badge || oldBadgeInfo || {};
        return {
          ...badgeInfo,
          balance: 1, // TODO: this should come from the backend
        };
      });

      dispatch(saveDbAction('badges', { badges: updatedBadges }, true));
      dispatch({ type: UPDATE_BADGES, payload: updatedBadges });
    }

    if (newBadgeReceived && notifyOnNewBadge) {
      Toast.show({
        message: 'New badge received!',
        type: 'success',
        title: 'Success',
        autoClose: true,
      });
    }
  };
};

export const fetchContactBadgesAction = (contact: Object) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      badges: { contactsBadges },
    } = getState();
    dispatch({ type: FETCHING_CONTACTS_BADGES });

    const contactBadges = await api.fetchContactBadges(walletId, contact.id);
    if (!contactBadges.length) {
      dispatch({ type: STOP_FETCHING_CONTACTS_BADGES });
      return;
    }

    const updatedContactsBadges = { ...contactsBadges, [contact.username]: contactBadges };

    dispatch(saveDbAction('contactsBadges', { contactsBadges: updatedContactsBadges }, true));
    dispatch({ type: ADD_CONTACT_BADGES, payload: { username: contact.username, badges: contactBadges } });
  };
};

export const selfAwardBadgeAction = (badgeType: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { user: { data: { walletId } } } = getState();
    dispatch(offlineApiCall('selfAwardBadge', walletId, badgeType));
  };
};

export const fetchBadgeAwardHistoryAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
    } = getState();
    const badgeAwardEvents = await api.fetchNotifications(walletId, BADGE_REWARD_EVENT);
    const badgeAwardEventsWithRequiredData = badgeAwardEvents.filter(({ payload }) => !!payload.name);
    const formattedBadgeAwardEvents = badgeAwardEventsWithRequiredData
      .map(({
        _id,
        type,
        payload,
        createdAt,
      }) => {
        const { name, imageUrl, id } = payload;
        return {
          _id,
          type,
          name,
          imageUrl,
          badgeId: id,
          createdAt,
        };
      });
    dispatch({ type: SET_BADGE_AWARD_EVENTS, payload: formattedBadgeAwardEvents });
    dispatch(saveDbAction('badgeAwardEvents', { badgeAwardEvents: formattedBadgeAwardEvents }, true));
  };
};
