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
import { generateKeyPairThreadPool } from 'utils/keyPairGenerator';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { restoreAccessTokensAction } from 'actions/onboardingActions';
import { updateConnectionsAction } from 'actions/connectionsActions';
import { saveDbAction } from './dbActions';

export const useConnectionKeyPairs = (count: number = 1) => {
  return async (dispatch: Function, getState: Function) => {
    const { connectionKeyPairs: { data: connectionKeyPairs } } = getState();
    const resultConnectionKeys = connectionKeyPairs.splice(0, count);
    await dispatch({
      type: UPDATE_CONNECTION_KEY_PAIRS,
      payload: connectionKeyPairs,
    });
    await dispatch(saveDbAction('connectionKeyPairs', { connectionKeyPairs }, true));
    return resultConnectionKeys;
  };
};

export const updateConnectionIdentityKeys = (successfullConnIdentityKeys: Object[]) => {
  return async (dispatch: Function, getState: Function) => {
    const { connectionIdentityKeys: { data: connectionIdentityKeys } } = getState();
    const resultConnectionIdentityKeys = connectionIdentityKeys.concat(successfullConnIdentityKeys);
    await dispatch({
      type: UPDATE_CONNECTION_IDENTITY_KEYS,
      payload: resultConnectionIdentityKeys,
    });
    await dispatch(
      saveDbAction(
        'connectionIdentityKeys',
        { connectionIdentityKeys: resultConnectionIdentityKeys },
        true),
    );
  };
};

export const mapIdentityKeysAction = (connectionPreKeyCount: number) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      connectionKeyPairs: { data: connectionKeyPairs },
    } = getState();

    const currentConnectionKeyPairs = connectionKeyPairs.slice(0, connectionPreKeyCount);
    const currentConnectionKeyPairList = currentConnectionKeyPairs.map((keyPair) => {
      return {
        sourceIdentityKey: keyPair.A,
        targetIdentityKey: keyPair.Ad,
      };
    });
    const connectionIdentityKeyMap = {
      walletId,
      identityKeys: currentConnectionKeyPairList,
    };

    let mappedKeysCount = 0;
    const successfullConnectionMaps = [];
    const resultCurrentConnections = await api.mapIdentityKeys(connectionIdentityKeyMap);
    if (resultCurrentConnections) {
      resultCurrentConnections.forEach((conn) => {
        if (conn.userId) {
          successfullConnectionMaps.push(conn);
          mappedKeysCount++;
        }
      });
    }
    await dispatch(updateConnectionIdentityKeys(successfullConnectionMaps));
    await dispatch(useConnectionKeyPairs(mappedKeysCount));
  };
};

export const updateOldConnections = (oldConnectionCount: number) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
      connectionKeyPairs: { data: connectionKeyPairs },
    } = getState();

    const mappedOldContactsAccessTokens = contacts.map((contact) => {
      const contactAccessTokens = accessTokens.find((at) => {
        return at.userId === contact.id;
      });
      return {
        ...contact,
        ...contactAccessTokens,
      };
    });

    let successUpdateCount = 0;
    if (oldConnectionCount > 0) {
      const mappedOldContacts = mappedOldContactsAccessTokens
        .filter((res) => { return res.myAccessToken && res.userAccessToken; });

      const mappedOldInvitations = accessTokens
        .filter((res) => { return res.userAccessToken === '' || res.myAccessToken === ''; });

      const mappedOldConnections = mappedOldContacts.concat(mappedOldInvitations);
      const identityKeysOldConnections = connectionKeyPairs.slice(0, mappedOldConnections.length);
      const oldConnectionsUpdateList = identityKeysOldConnections.map((keyPair, index) => {
        return {
          sourceUserAccessKey: mappedOldConnections[index].myAccessToken,
          targetUserAccessKey: mappedOldConnections[index].userAccessToken,
          sourceIdentityKey: keyPair.A,
          targetIdentityKey: keyPair.Ad,
          targetUserId: mappedOldConnections[index].userId,
        };
      });
      const oldConnectionsUpdateData = {
        walletId,
        connections: oldConnectionsUpdateList,
      };

      const resultOldConnections = await api.updateIdentityKeys(oldConnectionsUpdateData);
      if (resultOldConnections) {
        resultOldConnections.forEach((conn) => {
          if (conn.updated) {
            successUpdateCount++;
          }
        });
      }
    }

    await dispatch(mapIdentityKeysAction(successUpdateCount));
  };
};

export const updateConnectionKeyPairs = (mnemonic: string, privateKey: string, walletId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      connectionKeyPairs: { data: connectionKeyPairs, lastConnectionKeyIndex },
    } = getState();
    const numberOfConnections = await api.connectionsCount(walletId);
    const { currentConnectionsCount, oldConnectionsCount } = numberOfConnections;
    const totalConnections = currentConnectionsCount + oldConnectionsCount;
    const newKeyPairs =
      await generateKeyPairThreadPool(
        mnemonic,
        privateKey,
        totalConnections,
        connectionKeyPairs.length,
        lastConnectionKeyIndex);
    const resultConnectionKeys = connectionKeyPairs.concat(newKeyPairs);
    await dispatch({
      type: UPDATE_CONNECTION_KEY_PAIRS,
      payload: resultConnectionKeys,
    });
    await dispatch(saveDbAction('connectionKeyPairs', { connectionKeyPairs: resultConnectionKeys }, true));


    // TODO: Check all cases if old -> new connection gets updated but map returns false for the immediate update.
    await dispatch(updateOldConnections(oldConnectionsCount));
    if (lastConnectionKeyIndex === -1) {
      await dispatch(restoreAccessTokensAction(walletId));
      await dispatch(mapIdentityKeysAction(currentConnectionsCount));
    }

    await dispatch(updateConnectionsAction());
  };
};
