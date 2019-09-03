// @flow
import isEmpty from 'lodash.isempty';
import {
  UPDATE_BADGES,
  ADD_CONTACT_BADGES,
  FETCHING_CONTACTS_BADGES,
  STOP_FETCHING_CONTACTS_BADGES,
} from 'constants/badgesConstants';
import Toast from 'components/Toast';

import type { Dispatch, GetState } from 'reducers/rootReducer';

import { saveDbAction } from './dbActions';
import { offlineApiCall } from './offlineApiActions';

export const fetchBadgesAction = (notifyOnNewBadge: boolean = true) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      user: { data: { walletId } },
      wallet: { data: wallet },
      badges: { data: badges },
    } = getState();

    let newBadgeReceived = false;
    const userBadges = await api.fetchBadges(wallet.address);
    if (userBadges && Object.keys(userBadges).length) {
      const ids = Object.keys(userBadges).map(Number);
      const badgesInfo = await api.fetchBadgesInfo(walletId);

      const updatedBadges = ids.map(badgeId => {
        const oldBadgeInfo = badges.find(({ id }) => id === badgeId) || {};
        if (isEmpty(oldBadgeInfo)) newBadgeReceived = true;
        const badgeInfo = badgesInfo[badgeId] || oldBadgeInfo;
        return {
          ...badgeInfo,
          id: badgeId,
          balance: userBadges[badgeId],
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
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
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
