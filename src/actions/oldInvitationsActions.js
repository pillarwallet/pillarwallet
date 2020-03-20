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

// actions
import { getExistingChatsAction } from 'actions/chatActions';
import { restoreAccessTokensAction } from 'actions/onboardingActions';
import { updateConnectionsAction } from 'actions/connectionsActions';

// constants
import {
  TYPE_ACCEPTED,
  TYPE_BLOCKED,
  TYPE_CANCELLED,
  TYPE_DISCONNECTED,
  TYPE_RECEIVED,
  TYPE_REJECTED,
  TYPE_SENT,
  UPDATE_INVITATIONS,
} from 'constants/invitationsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';

// utils
import { uniqBy } from 'utils/common';
import { mapInviteNotifications } from 'utils/notifications';

// models, types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { ApiNotification } from 'models/Notification';

// local
import { saveDbAction } from './dbActions';


export const fetchOldInviteNotificationsAction = (theWalletId?: string = '') => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      invitations: { data: invitations },
      contacts: { data: contacts },
      user: { data: { walletId = theWalletId } },
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) return;

    let accessTokens = getState().accessTokens.data;

    if (accessTokens === undefined || !accessTokens.length) {
      await dispatch(restoreAccessTokensAction(walletId));
      accessTokens = getState().accessTokens.data;
    }

    const types = [
      TYPE_RECEIVED,
      TYPE_ACCEPTED,
      TYPE_CANCELLED,
      TYPE_BLOCKED,
      TYPE_REJECTED,
      TYPE_DISCONNECTED,
    ];

    const inviteNotifications: ApiNotification[] = await api.fetchNotifications(walletId, types.join(' '));
    const mappedInviteNotifications = mapInviteNotifications(inviteNotifications);

    const groupedByUserId = mappedInviteNotifications.reduce((memo, invitation, index, arr) => {
      const group = arr.filter(({ id: userId }) => userId === invitation.id);
      memo[invitation.id] = uniqBy(group, 'id');
      return memo;
    }, {});

    const latestEventPerId = Object.keys(groupedByUserId).map((key) => groupedByUserId[key][0]);
    const groupedNotifications = types.reduce((memo, type) => {
      memo[type] = latestEventPerId.filter(({ type: invType }) => invType === type);
      return memo;
    }, {});

    // CLEANUP REQUIRED
    const invitationsToExclude = [
      ...contacts,
      ...groupedNotifications.connectionCancelledEvent,
      ...groupedNotifications.connectionAcceptedEvent,
      ...groupedNotifications.connectionRejectedEvent,
    ].map(({ id: userId }) => userId);

    const sentInvitations = invitations.filter(invi => invi.type === TYPE_SENT);

    // all latest notifications + sent invitations per contact
    const updatedInvitations = uniqBy(latestEventPerId.concat(sentInvitations), 'id')
      .filter(({ id }) => !invitationsToExclude.includes(id));

    // find new connections
    const contactsIds = contacts.map(({ id: userId }) => userId);
    const newConnections = groupedNotifications.connectionAcceptedEvent
      .filter(({ id }) => !contactsIds.includes(id));

    // clean up local contacts
    const acceptedConnectionsIds = groupedNotifications.connectionAcceptedEvent.map(({ id }) => id);
    const disconnectedConnectionsIds = groupedNotifications.connectionDisconnectedEvent.map(({ id }) => id);
    const consistentLocalContacts = contacts.filter(({ id: contactId }) =>
      acceptedConnectionsIds.includes(contactId));

    // newConnections -> just accepted our invite, are not yet stored
    // consistentLocalContacts -> old contacts with the latest event = Accepted
    const updatedContacts = uniqBy(newConnections.concat(consistentLocalContacts), 'id')
      .map(({ type, connectionKey, ...rest }) => ({ ...rest }))
      .filter(updatedContact => !disconnectedConnectionsIds.includes(updatedContact.id));

    // save new connections keys
    let updatedAccessTokens = [...accessTokens];
    newConnections.forEach(({ id, connectionKey }) => {
      updatedAccessTokens = accessTokens.map(accessToken => {
        if (accessToken.userId !== id) return accessToken;
        return { ...accessToken, userAccessToken: connectionKey };
      });
    });

    await dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));
    await dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));
    await dispatch(saveDbAction('accessTokens', { accessTokens: updatedAccessTokens }, true));

    await dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });
    await dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });
    await dispatch({
      type: UPDATE_ACCESS_TOKENS,
      payload: updatedAccessTokens,
    });

    await dispatch(updateConnectionsAction());
    await dispatch(getExistingChatsAction());
  };
};
