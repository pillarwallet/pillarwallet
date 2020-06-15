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

// actions
import { syncContactsSmartAddressesAction } from 'actions/contactsActions';
import { getExistingChatsAction } from 'actions/chatActions';

// constants
import {
  STATUS_ACCEPTED,
  STATUS_BLOCKED,
  STATUS_MUTED,
  STATUS_CANCELLED,
  STATUS_DISCONNECTED,
  STATUS_PENDING,
  STATUS_REJECTED,
} from 'constants/connectionsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { TYPE_SENT, UPDATE_INVITATIONS, TYPE_RECEIVED } from 'constants/invitationsConstants';

// utils
import { uniqBy } from 'utils/common';

// services
import type SDKWrapper from 'services/api';

// models, types
import type { ApiContact } from 'models/Contacts';
import type { Dispatch, GetState } from 'reducers/rootReducer';

import { saveDbAction } from './dbActions';


export const updateConnectionsAction = (theWalletId: ?string = null) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId = theWalletId } },
      session: { data: { isOnline } },
    } = getState();

    if (!walletId || !isOnline) {
      return;
    }

    const connections: ApiContact[] = await api.getContacts(walletId);

    if (isEmpty(connections)) {
      return;
    }

    const contacts = [];
    const invitations = [];
    const removeContacts = [];
    const removeInvitations = [];

    connections.forEach((connection: ApiContact) => {
      if (!connection.targetUserInfo) return;
      if ([STATUS_ACCEPTED, STATUS_MUTED, STATUS_BLOCKED].includes(connection.status)) {
        const contact = {
          id: connection.targetUserId,
          ethAddress: connection.targetUserInfo.ethAddress,
          username: connection.targetUserInfo.username,
          profileImage: connection.targetUserInfo.profileImage,
          createdAt: connection.createdAt ? Date.parse(connection.createdAt) / 1000 : null,
          updatedAt: connection.updatedAt ? Date.parse(connection.updatedAt) / 1000 : null,
          status: connection.status,
        };
        contacts.push(contact);
        removeInvitations.push(connection.targetUserId);
      } else if (connection.status === STATUS_PENDING) {
        const invitation = {
          id: connection.targetUserId,
          username: connection.targetUserInfo.username,
          profileImage: connection.targetUserInfo.profileImage,
          type: connection.direction && connection.direction === 'sent' ? TYPE_SENT : TYPE_RECEIVED,
          createdAt: connection.createdAt ? Date.parse(connection.createdAt) / 1000 : null,
          updatedAt: connection.createdAt ? Date.parse(connection.createdAt) / 1000 : null,
        };
        invitations.push(invitation);
        removeContacts.push(connection.targetUserId);
      } else if ([STATUS_REJECTED, STATUS_CANCELLED, STATUS_DISCONNECTED].includes(connection.status)) {
        removeInvitations.push(connection.targetUserId);
        removeContacts.push(connection.targetUserId);
      }
    });

    const updatedContacts = uniqBy(contacts, 'id')
      .filter(({ id }) => !removeContacts.includes(id));
    const updatedInvitations = uniqBy(invitations, 'id')
      .filter(({ id }) => !removeInvitations.includes(id));

    dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));
    dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });

    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });

    dispatch(getExistingChatsAction());
    dispatch(syncContactsSmartAddressesAction());
  };
};

