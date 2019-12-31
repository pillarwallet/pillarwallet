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
import get from 'lodash.get';
import { Sentry } from 'react-native-sentry';

// actions
import { getExistingChatsAction } from 'actions/chatActions';
import { restoreAccessTokensAction } from 'actions/onboardingActions';
import { updateConnectionsAction } from 'actions/connectionsActions';
import {
  mapIdentityKeysAction,
  prependConnectionKeyPairs,
} from 'actions/connectionKeyPairActions';

// constants
import {
  ADD_INVITATION,
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
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';

// utils
import { generateAccessKey } from 'utils/invitations';
import { uniqBy } from 'utils/common';
import { getIdentityKeyPairs } from 'utils/connections';

// models, types
import type { ApiUser } from 'models/Contacts';
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';

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

    let {
      accessTokens: { data: accessTokens },
    } = getState();

    if (accessTokens === undefined || !accessTokens.length) {
      await dispatch(restoreAccessTokensAction(walletId));
      const {
        accessTokens: { data: updatedAccessTokens },
      } = getState();
      accessTokens = updatedAccessTokens;
    }

    const types = [
      TYPE_RECEIVED,
      TYPE_ACCEPTED,
      TYPE_CANCELLED,
      TYPE_BLOCKED,
      TYPE_REJECTED,
      TYPE_DISCONNECTED,
    ];
    const inviteNotifications = await api.fetchNotifications(walletId, types.join(' '));
    const mappedInviteNotifications = inviteNotifications
      .map((_notification) => {
        const createdAt = get(_notification, 'createdAt');
        let parsedMessage = {};
        try {
          parsedMessage = JSON.parse(_notification.payload.msg);
        } catch (e) {
          //
        }
        return { ...parsedMessage, createdAt };
      })
      .map(({ senderUserData, type, createdAt }) => ({ ...senderUserData, type, createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);

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

export const sendOldInvitationAction = (user: ApiUser) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      accessTokens: { data: accessTokens },
    } = getState();

    const index = invitations.findIndex(el => el.id === user.id);
    if (index >= 0) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'Invitation has already been sent' },
      }));
      return;
    }

    const accessKey = generateAccessKey();
    const sentInvitation = await api.sendOldInvitation(user.id, accessKey, walletId);
    if (!sentInvitation) return;
    const invitation = {
      ...user,
      type: TYPE_SENT,
      connectionKey: accessKey,
      createdAt: +new Date() / 1000,
    };
    dispatch(saveDbAction('invitations', { invitations: [...invitations, invitation] }, true));

    const updatedAccessTokens = accessTokens
      .filter(({ userId }) => userId !== user.id)
      .concat({
        userId: user.id,
        myAccessToken: accessKey,
        userAccessToken: '',
      });
    dispatch(saveDbAction('accessTokens', { accessTokens: updatedAccessTokens }, true));

    dispatch({
      type: ADD_INVITATION,
      payload: invitation,
    });
    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: 'Invitation sent' },
    }));
    dispatch({
      type: UPDATE_ACCESS_TOKENS,
      payload: updatedAccessTokens,
    });
  };
};

export const acceptOldInvitationAction = (invitation: Object) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
      connectionIdentityKeys: { data: connectionIdentityKeys },
    } = getState();
    const sourceUserAccessKey = generateAccessKey();

    const {
      sourceIdentityKey,
      targetIdentityKey,
      connIdKeyResult,
      connKeyPairReserved,
    } = await getIdentityKeyPairs(invitation.id, connectionIdentityKeys, dispatch);

    const acceptedInvitation = await api.acceptOldInvitation(
      invitation.id,
      invitation.connectionKey,
      sourceUserAccessKey,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
    );

    if (!connIdKeyResult) {
      await dispatch(prependConnectionKeyPairs(connKeyPairReserved));
    }

    if (!acceptedInvitation) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'Invitation doesn\'t exist' },
      }));
      dispatch(fetchOldInviteNotificationsAction());
      Sentry.captureMessage('Ghost invitation on acceptOld', {
        level: 'info',
        extra: {
          invitationId: invitation.id,
          connectionKey: invitation.connectionKey,
          walletId,
        },
      });
      return;
    }

    if (!connIdKeyResult) {
      await dispatch(mapIdentityKeysAction(1));
    }

    const updatedInvitations = invitations.filter(({ id }) => id !== invitation.id);
    dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    const updatedContacts = contacts
      .filter(({ id }) => id !== invitation.id)
      .concat(invitation)
      .map(({ type, connectionKey, ...rest }) => ({ ...rest }));
    dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    const updatedAccessTokens = accessTokens
      .filter(({ userId }) => userId !== invitation.id)
      .concat({
        userId: invitation.id,
        myAccessToken: sourceUserAccessKey,
        userAccessToken: invitation.connectionKey,
      });
    dispatch(saveDbAction('accessTokens', { accessTokens: updatedAccessTokens }, true));

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });
    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });
    dispatch({
      type: UPDATE_ACCESS_TOKENS,
      payload: updatedAccessTokens,
    });
    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: 'Connection request accepted' },
    }));
  };
};

export const cancelOldInvitationAction = (invitation: Object) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      accessTokens: { data: accessTokens },
    } = getState();

    const cancelledInvitation = await api.cancelOldInvitation(
      invitation.id,
      invitation.connectionKey,
      walletId,
    );

    if (!cancelledInvitation) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { title: invitation.username, message: 'Already accepted your request' },
      }));
      dispatch(fetchOldInviteNotificationsAction());
      return;
    }

    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: 'Invitation cancelled' },
    }));

    const updatedInvitations = invitations.filter(({ id }) => id !== invitation.id);
    dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    const updatedAccessTokens = accessTokens.filter(({ userId }) => userId !== invitation.id);
    dispatch(saveDbAction('accessTokens', { accessTokens: updatedAccessTokens }, true));

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });
    dispatch({
      type: UPDATE_ACCESS_TOKENS,
      payload: updatedAccessTokens,
    });
  };
};

export const rejectOldInvitationAction = (invitation: Object) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
    } = getState();
    const rejectedInvitation = await api.rejectOldInvitation(
      invitation.id,
      invitation.connectionKey,
      walletId,
    );

    if (!rejectedInvitation) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'Invitation doesn\'t exist' },
      }));
      dispatch(fetchOldInviteNotificationsAction());
      Sentry.captureMessage('Ghost invitation on rejectOld', {
        level: 'info',
        extra: {
          invitationId: invitation.id,
          connectionKey: invitation.connectionKey,
          walletId,
        },
      });
      return;
    }

    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: 'Invitation rejected' },
    }));

    const updatedInvitations = invitations.filter(({ id }) => id !== invitation.id);
    dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });
  };
};
