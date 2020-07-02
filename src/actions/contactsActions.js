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

// actions
import { updateConnectionsAction } from 'actions/connectionsActions';
import { logEventAction } from 'actions/analyticsActions';
import { saveDbAction } from 'actions/dbActions';
import { deleteChatAction, deleteContactAction } from 'actions/chatActions';

// constants
import {
  UPDATE_CONTACTS,
  START_SYNC_CONTACTS_SMART_ADDRESSES,
  UPDATE_CONTACTS_SMART_ADDRESSES,
} from 'constants/contactsConstants';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const syncContactAction = (userId: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      user: { data: { walletId } },
      contacts: { data: contacts },
    } = getState();

    const userInfo = await api.userInfoById(userId, walletId);

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
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      contacts: { data: contacts },
    } = getState();

    const disconnectResult = await api.disconnectUser(
      contactId,
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
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
    } = getState();

    const muteResult = await api.muteUser(
      contactId,
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
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      contacts: { data: contacts },
    } = getState();

    const blockResult = await api.blockUser(
      contactId,
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

export const syncContactsSmartAddressesAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      user: { data: { walletId } },
      contacts: { data: contacts },
    } = getState();

    dispatch({ type: START_SYNC_CONTACTS_SMART_ADDRESSES });

    // get all connections keys
    const connections = contacts.map(({ id: contactId }) => ({ contactId }));

    // call the api
    const { smartWallets: contactsSmartAddresses } =
      await api.getContactsSmartAddresses(walletId, connections) || {};

    if (!contactsSmartAddresses) return;

    // store the result
    dispatch({
      type: UPDATE_CONTACTS_SMART_ADDRESSES,
      payload: contactsSmartAddresses,
    });
    dispatch(saveDbAction('contactsSmartAddresses', { contactsSmartAddresses }, true));

    // update session
    dispatch({
      type: UPDATE_SESSION,
      payload: { contactsSmartAddressesSynced: true },
    });
  };
};
