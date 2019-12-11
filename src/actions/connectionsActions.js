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

// constants
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { TYPE_SENT, UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { STATUS_ACCEPTED, STATUS_BLOCKED, STATUS_MUTED } from 'constants/connectionsConstants';

// utils
import { uniqBy } from 'utils/common';

// services
import SDKWrapper from 'services/api';

// models, types
import type { ConnectionIdentityKey } from 'models/Connections';
import type { Dispatch, GetState } from 'reducers/rootReducer';

import { saveDbAction } from './dbActions';


type GroupedConnectionIdentityKeys = { [string]: ConnectionIdentityKey };

export const updateConnectionsAction = (theWalletId?: ?string = null) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId = theWalletId } },
      connectionIdentityKeys: { data: connectionIdentityKeys },
      contacts: { data: allContacts },
      invitations: { data: allInvitations },
      featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
    } = getState();

    if (!walletId) {
      return;
    }

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
    const removeContacts = [];
    const removeInvitations = [];

    // CIK – ConnectionIdentityKey
    const groupedByUserWithLatestCIK: GroupedConnectionIdentityKeys = resultConnections
      .reduce((groupedByUser: GroupedConnectionIdentityKeys, cik: ConnectionIdentityKey) => {
        const { targetUserId, updatedAt } = cik;
        if (isEmpty(groupedByUser[targetUserId])) {
          return {
            ...groupedByUser,
            [targetUserId]: cik,
          };
        }
        // by this point it means it's another event with same user
        const { updatedAt: prevUpdatedAt } = groupedByUser[targetUserId];
        // check if another event for the same user is newer and change if so
        if (updatedAt > prevUpdatedAt) {
          return {
            ...groupedByUser,
            [targetUserId]: cik,
          };
        }
        return groupedByUser;
      }, {});

    const usersListWithTheirLatestCIK = (Object.values(groupedByUserWithLatestCIK): any);
    usersListWithTheirLatestCIK.forEach((resConn: ConnectionIdentityKey) => {
      if (resConn.status === STATUS_ACCEPTED || resConn.status === STATUS_MUTED || resConn.status === STATUS_BLOCKED) {
        const contact = {
          id: resConn.targetUserId,
          ethAddress: resConn.targetUserInfo.ethAddress,
          username: resConn.targetUserInfo.username,
          profileImage: resConn.targetUserInfo.profileImage,
          createdAt: resConn.createdAt ? Date.parse(resConn.createdAt) / 1000 : null,
          updatedAt: resConn.updatedAt ? Date.parse(resConn.updatedAt) / 1000 : null,
          status: resConn.status,
        };
        contacts.push(contact);
        removeInvitations.push(resConn.targetUserId);
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
            targetUserIdentityKeys: {
              sourceIdentityKey: invitation.sourceIdentityKey,
              targetIdentityKey: invitation.targetIdentityKey,
            },
          };
        } else {
          invi = {
            id: resConn.targetUserId,
            username: resConn.targetUserInfo.username,
            connectionKey: resConn.sourceUserAccessKey,
            profileImage: resConn.targetUserInfo.profileImage,
            type: TYPE_SENT,
            sourceIdentityKey: resConn.sourceIdentityKey,
            targetIdentityKey: resConn.targetIdentityKey,
            createdAt: resConn.createdAt ? Date.parse(resConn.createdAt) / 1000 : null,
            sourceUserIdentityKeys: {
              sourceIdentityKey: resConn.sourceIdentityKey,
              targetIdentityKey: resConn.targetIdentityKey,
            },
          };
        }
        invitations.push(invi);
        removeContacts.push(resConn.targetUserId);
      } else if (resConn.status === 'rejected' || resConn.status === 'cancelled' || resConn.status === 'disconnected') {
        removeInvitations.push(resConn.targetUserId);
        removeContacts.push(resConn.targetUserId);
      }
    });

    const updatedContacts = uniqBy(contacts.concat(allContacts), 'id')
      .filter(conn => !removeContacts.includes(conn.id));
    const updatedInvitations = uniqBy(invitations.concat(allInvitations), 'id')
      .filter(invi => !removeInvitations.includes(invi.id));
    const updatedConnectionIdentityKeys = uniqBy(resultConnections.concat(connectionIdentityKeys), 'sourceIdentityKey');

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
      payload: updatedConnectionIdentityKeys,
    });
    dispatch(
      saveDbAction(
        'connectionIdentityKeys',
        { connectionIdentityKeys: updatedConnectionIdentityKeys },
        true),
    );

    if (smartWalletFeatureEnabled) {
      dispatch(syncContactsSmartAddressesAction());
    }
  };
};

