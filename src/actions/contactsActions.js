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
import partition from 'lodash.partition';
import {
  UPDATE_SEARCH_RESULTS,
  FETCHING,
  UPDATE_CONTACTS_STATE,
  UPDATE_CONTACTS,
} from 'constants/contactsConstants';
import type { ConnectionIdentityKey } from 'models/Connections';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { excludeLocalContacts } from 'utils/contacts';
import { updateConnectionsAction } from 'actions/connectionsActions';
import { logEventAction } from 'actions/analyticsActions';
import { saveDbAction } from './dbActions';
import { deleteChatAction, deleteContactAction } from './chatActions';

export const searchContactsAction = (query: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } }, contacts: { data: localContacts } } = getState();

    dispatch({
      type: UPDATE_CONTACTS_STATE,
      payload: FETCHING,
    });

    let apiUsers = await api.userSearch(query, walletId);
    apiUsers = excludeLocalContacts(apiUsers, localContacts);

    const myContacts = localContacts.filter(contact => {
      return contact.username.toUpperCase().indexOf(query.toUpperCase()) > -1;
    });

    dispatch({
      type: UPDATE_SEARCH_RESULTS,
      payload: {
        apiUsers,
        localContacts: myContacts,
      },
    });
  };
};

export const resetSearchContactsStateAction = () => {
  return async (dispatch: Function) => {
    dispatch({
      type: UPDATE_CONTACTS_STATE,
      payload: null,
    });
  };
};

export const syncContactAction = (userId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
    } = getState();

    const accessToken = accessTokens.find(token => token.userId === userId);
    if (!accessToken) return;

    const userInfo = await api.userInfoById(userId, {
      walletId,
      userAccessKey: accessToken.myAccessToken,
      targetUserAccessKey: accessToken.userAccessToken,
    });

    if (!userInfo || !Object.keys(userInfo).length) {
      return;
    }

    const oldInfo = contacts.find(({ id }) => id === userId) || {};
    const currentDate = +new Date();
    const updatedContacts = contacts
      .filter(({ id }) => id !== userId)
      .concat({
        ...userInfo,
        createdAt: oldInfo.createdAt || currentDate,
        lastUpdateTime: currentDate,
        status: oldInfo.status,
      });
    dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });
  };
};

export const disconnectContactAction = (contactId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      contacts: { data: contacts },
      connectionIdentityKeys: { data: connectionIdentityKeys },
    } = getState();


    const { sourceIdentityKey, targetIdentityKey } = connectionIdentityKeys.find((cik: ConnectionIdentityKey) => {
      return cik.targetUserId === contactId;
    }) || { sourceIdentityKey: null, targetIdentityKey: null };

    const disconnectResult = await api.disconnectUser(
      contactId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
    );

    if (!disconnectResult) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: 'Connection cannot be disconnected' },
      }));
      dispatch(updateConnectionsAction(walletId));
      return;
    }

    dispatch(logEventAction('contact_disconnected'));

    const [contactToDisconnect, updatedContacts] = partition(contacts, (contact) =>
      contact.id === contactId);

    await dispatch(deleteChatAction(contactToDisconnect[0].username));
    await dispatch(deleteContactAction(contactToDisconnect[0].username));

    await dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    const updatedInvitations = invitations.filter(({ id }) => id !== contactId);

    await dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });

    dispatch(updateConnectionsAction(walletId));

    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: 'Successfully Disconnected' },
    }));
  };
};

export const muteContactAction = (contactId: string, mute: boolean) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      connectionIdentityKeys: { data: connectionIdentityKeys },
    } = getState();


    const { sourceIdentityKey, targetIdentityKey } = connectionIdentityKeys.find((cik: ConnectionIdentityKey) => {
      return cik.targetUserId === contactId;
    }) || { sourceIdentityKey: null, targetIdentityKey: null };

    const muteResult = await api.muteUser(
      contactId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
      mute,
    );

    if (!muteResult) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: `${mute ? 'Mute' : 'Unmute'} action cannot be performed.` },
      }));
      dispatch(updateConnectionsAction(walletId));
      return;
    }

    dispatch(logEventAction(mute ? 'contact_muted' : 'contact_unmuted'));

    const updatedInvitations = invitations.filter(({ id }) => id !== contactId);

    await dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });

    dispatch(updateConnectionsAction(walletId));

    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: `${mute ? 'Mute' : 'Unmute'} Successful` },
    }));
  };
};

export const blockContactAction = (contactId: string, block: boolean) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      contacts: { data: contacts },
      connectionIdentityKeys: { data: connectionIdentityKeys },
    } = getState();


    const { sourceIdentityKey, targetIdentityKey } = connectionIdentityKeys.find((cik: ConnectionIdentityKey) => {
      return cik.targetUserId === contactId;
    }) || { sourceIdentityKey: null, targetIdentityKey: null };

    const blockResult = await api.blockUser(
      contactId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
      block,
    );

    if (!blockResult) {
      dispatch(({
        type: ADD_NOTIFICATION,
        payload: { message: `${block ? 'Block' : 'Unblock'} action cannot be performed.` },
      }));
      dispatch(updateConnectionsAction(walletId));
      return;
    }

    dispatch(logEventAction(block ? 'contact_blocked' : 'contact_unblocked'));

    const [contactToBlock, updatedContacts] = partition(contacts, (contact) =>
      contact.id === contactId);

    await dispatch(deleteChatAction(contactToBlock[0].username));
    await dispatch(deleteContactAction(contactToBlock[0].username));

    await dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    const updatedInvitations = invitations.filter(({ id }) => id !== contactId);

    await dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });

    dispatch(updateConnectionsAction(walletId));

    dispatch(({
      type: ADD_NOTIFICATION,
      payload: { message: `${block ? 'Block' : 'Unblock'} Successful` },
    }));
  };
};
