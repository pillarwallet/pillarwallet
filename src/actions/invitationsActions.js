// @flow
import { generateAccessKey } from 'utils/invitations';
import type { ApiUser } from 'models/Contacts';
import { uniqBy } from 'utils/common';
import {
  ADD_INVITATION,
  TYPE_SENT,
  UPDATE_INVITATIONS,
  TYPE_ACCEPTED,
  TYPE_CANCELLED,
  TYPE_BLOCKED,
  TYPE_REJECTED,
  TYPE_RECEIVED,
} from 'constants/invitationsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';
import { getExistingChatsAction } from 'actions/chatActions';
import { saveDbAction } from './dbActions';

export const fetchInviteNotificationsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      invitations: { data: invitations },
      contacts: { data: contacts },
      user: { data: user },
      accessTokens: { data: accessTokens },
    } = getState();

    const types = [
      TYPE_RECEIVED,
      TYPE_ACCEPTED,
      TYPE_CANCELLED,
      TYPE_BLOCKED,
      TYPE_REJECTED,
    ];
    const inviteNotifications = await api.fetchNotifications(user.walletId, types.join(' '));
    const mappedInviteNotifications = inviteNotifications
      .map(({ payload: { msg }, createdAt }) => ({ ...JSON.parse(msg), createdAt }))
      .map(({ senderUserData, type, createdAt }) => ({ ...senderUserData, type, createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);

    const groupedByUserId = mappedInviteNotifications.reduce((memo, invitation, index, arr) => {
      const group = arr.filter(({ id: userId }) => userId === invitation.id);
      const uniqGroup = uniqBy(group, 'id');
      memo[invitation.id] = uniqGroup;
      return memo;
    }, {});

    const latestEventPerId = Object.keys(groupedByUserId).map((key) => groupedByUserId[key][0]);
    const groupedNotifications = types.reduce((memo, type) => {
      const group = latestEventPerId.filter(({ type: invType }) => invType === type);
      memo[type] = group;
      return memo;
    }, {});

    // CLEANUP REQUIRED
    const invitationsToExclude = [
      ...contacts,
      ...groupedNotifications.connectionCancelledEvent,
      ...groupedNotifications.connectionAcceptedEvent,
      ...groupedNotifications.connectionRejectedEvent,
    ].map(({ id: userId }) => userId);

    const updatedInvitations = uniqBy(latestEventPerId.concat(invitations), 'id')
      .filter(({ id }) => !invitationsToExclude.includes(id));

    // find new connections
    const contactsIds = contacts.map(({ id: userId }) => userId);
    const newConnections = groupedNotifications.connectionAcceptedEvent
      .filter(({ id }) => !contactsIds.includes(id));

    const updatedContacts = uniqBy(newConnections.concat(contacts), 'id')
      .map(({ type, connectionKey, ...rest }) => ({ ...rest }));

    // save new connections keys
    let updatedAccessTokens = [...accessTokens];
    newConnections.forEach(({ id, connectionKey }) => {
      updatedAccessTokens = accessTokens.map(accessToken => {
        if (accessToken.userId !== id) return accessToken;
        return { ...accessToken, userAccessToken: connectionKey };
      });
    });
    dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));
    dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));
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
    dispatch(getExistingChatsAction());
  };
};

export const sendInvitationAction = (user: ApiUser) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
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
    const sentInvitation = await api.sendInvitation(user.id, accessKey, walletId);
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
      payload: { message: 'Invitation sent!' },
    }));
    dispatch({
      type: UPDATE_ACCESS_TOKENS,
      payload: updatedAccessTokens,
    });
  };
};

export const acceptInvitationAction = (invitation: Object) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
    } = getState();
    const sourceUserAccessKey = generateAccessKey();

    const acceptedInvitation = await api.acceptInvitation(
      invitation.id,
      invitation.connectionKey,
      sourceUserAccessKey,
      walletId,
    );
    if (!acceptedInvitation) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'Invitation doesn\'t exist' },
      }));
      dispatch(fetchInviteNotificationsAction());
      return;
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
      payload: { message: 'Invitation accepted!' },
    }));
  };
};

export const cancelInvitationAction = (invitation: Object) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      accessTokens: { data: accessTokens },
    } = getState();

    const cancelledInvitation = await api.cancelInvitation(
      invitation.id,
      invitation.connectionKey,
      walletId,
    );

    if (!cancelledInvitation) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'User already accepted yours invitation' },
      }));
      dispatch(fetchInviteNotificationsAction());
      return;
    }

    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: 'Invitation cancelled!' },
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

export const rejectInvitationAction = (invitation: Object) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
    } = getState();

    const rejectedInvitation = await api.rejectInvitation(
      invitation.id,
      invitation.connectionKey,
      walletId,
    );

    if (!rejectedInvitation) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'Invitation doesn\'t exist' },
      }));
      dispatch(fetchInviteNotificationsAction());
      return;
    }

    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: 'Invitation rejected!' },
    }));

    const updatedInvitations = invitations.filter(({ id }) => id !== invitation.id);
    dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });
  };
};
