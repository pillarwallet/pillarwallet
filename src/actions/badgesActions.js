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
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// components
import Toast from 'components/Toast';

// constants
import {
  UPDATE_BADGES,
  ADD_CONTACT_BADGES,
  FETCHING_CONTACTS_BADGES,
  STOP_FETCHING_CONTACTS_BADGES,
  BADGE_REWARD_EVENT,
  SET_BADGE_AWARD_EVENTS,
} from 'constants/badgesConstants';
import { WALLET_CREATE_EVENT } from 'constants/userEventsConstants';

// models, types
import type { ApiNotification } from 'models/Notification';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';

// actions
import { saveDbAction } from './dbActions';
import { offlineApiCall } from './offlineApiActions';


export const fetchBadgesAction = (notifyOnNewBadge: boolean = true) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      badges: { data: badges },
    } = getState();

    let newBadgeName = null;
    const userBadges = await api.fetchBadges(walletId);

    if (!isEmpty(userBadges)) {
      const updatedBadges = userBadges.map(badge => {
        const badgeId = badge.id;
        const oldBadgeInfo = badges.find(({ id }) => id === badgeId);
        if (!oldBadgeInfo) newBadgeName = badge.name;
        const badgeInfo = badge || oldBadgeInfo || {};
        return {
          ...badgeInfo,
          balance: 1, // TODO: this should come from the backend
        };
      });

      dispatch(saveDbAction('badges', { badges: updatedBadges }, true));
      dispatch({ type: UPDATE_BADGES, payload: updatedBadges });
    }

    if (newBadgeName && notifyOnNewBadge) {
      Toast.show({
        message: t('toast.badgeReceived', { badgeName: newBadgeName }),
        emoji: 'ok_hand',
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
      userEvents: { data: userEvents = [] },
    } = getState();
    const badgeAwardEvents: ApiNotification[] = await api.fetchNotifications(walletId, BADGE_REWARD_EVENT);
    const badgeAwardEventsWithRequiredData = badgeAwardEvents.filter(({ payload }) => !!payload.name);
    const walletCreateEvent = userEvents.find(({ subType }) => subType === WALLET_CREATE_EVENT);
    const formattedBadgeAwardEvents = badgeAwardEventsWithRequiredData
      .map(({
        _id,
        type,
        payload,
        createdAt: originalCreatedAt,
      }) => {
        const {
          name,
          imageUrl,
          id,
          badgeType,
        } = payload;

        // part of key wallet remove migration – wallet create badge in history should be after smart wallet creation
        const createdAt = walletCreateEvent && badgeType === 'wallet-created'
          ? Number(walletCreateEvent.createdAt) + 1
          : originalCreatedAt;
        return {
          _id,
          type,
          name,
          imageUrl,
          badgeId: id,
          createdAt,
          badgeType,
        };
      });
    dispatch({ type: SET_BADGE_AWARD_EVENTS, payload: formattedBadgeAwardEvents });
    dispatch(saveDbAction('badgeAwardEvents', { badgeAwardEvents: formattedBadgeAwardEvents }, true));
  };
};
