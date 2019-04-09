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

import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { TYPE_SENT, UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import type { ConnectionIdentityKey } from 'models/Connections';
import { uniqBy } from 'utils/common';
import { saveDbAction } from './dbActions';

export const updateConnectionsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      connectionIdentityKeys: { data: connectionIdentityKeys },
      contacts: { data: allContacts },
      invitations: { data: allInvitations },
    } = getState();

    const currentConnectionKeyPairList = connectionIdentityKeys.map((cik: ConnectionIdentityKey) => {
      return {
        sourceIdentityKey: cik.sourceIdentityKey,
        targetIdentityKey: cik.targetIdentityKey,
      };
    });
    const connectionIdentityKeyMap = {
      walletId,
      identityKeys: currentConnectionKeyPairList,
    };

    const resultConnections: ConnectionIdentityKey[] = await api.mapIdentityKeys(connectionIdentityKeyMap);

    const contacts = [];
    const invitations = [];
    resultConnections.forEach((resConn: ConnectionIdentityKey) => {
      if (resConn.status === 'accepted') {
        const contact = {
          id: resConn.targetUserId,
          ethAddress: resConn.targetUserInfo.ethAddress,
          username: resConn.targetUserInfo.username,
          profileImage: resConn.targetUserInfo.profileImage,
          createdAt: resConn.createdAt,
          updatedAt: resConn.updatedAt,
        };
        contacts.push(contact);
      } else if (resConn.status === 'pending') {
        const invitation = allInvitations.find((inv) => {
          return inv.id === resConn.targetUserId;
        });
        let invi;
        if (invitation) {
          invi = {
            ...invitation,
            sourceUserIdentityKeys: {
              sourceIdentityKey: resConn.sourceIdentityKey,
              targetIdentityKey: resConn.targetIdentityKey,
            },
          };
        } else {
          invi = {
            id: resConn.targetUserId,
            username: resConn.targetUserInfo.username,
            connectionKey: resConn.sourceUserAccessKey,
            profileImage: resConn.targetUserInfo.profileImage,
            type: TYPE_SENT,
            createdAt: resConn.createdAt,
            sourceUserIdentityKeys: {
              sourceIdentityKey: resConn.sourceIdentityKey,
              targetIdentityKey: resConn.targetIdentityKey,
            },
          };
        }
        invitations.push(invi);
      }
    });

    const updatedContacts = uniqBy(contacts.concat(allContacts), 'id');
    const updatedInvitations = uniqBy(invitations.concat(allInvitations), 'id');

    dispatch({
      type: UPDATE_INVITATIONS,
      payload: updatedInvitations,
    });
    dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });
    dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    dispatch({
      type: UPDATE_CONNECTION_IDENTITY_KEYS,
      payload: resultConnections,
    });
    dispatch(
      saveDbAction(
        'connectionIdentityKeys',
        { connectionIdentityKeys: resultConnections },
        true),
    );
  };
};

