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
import { InteractionManager } from 'react-native';
import { generateKeyPairThreadPool } from 'utils/keyPairGenerator';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { GENERATING_CONNECTIONS, UPDATE_WALLET_STATE, DECRYPTED } from 'constants/walletConstants';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { restoreAccessTokensAction } from 'actions/onboardingActions';
import { fetchOldInviteNotificationsAction } from 'actions/oldInvitationsActions';
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

export const prependConnectionKeyPairs = (connKeyPairs: Object[] = []) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      connectionKeyPairs: { data: connectionKeyPairs },
    } = getState();
    connKeyPairs.sort((a, b) => a.connIndex - b.connIndex);
    const resultConnectionKeys = connKeyPairs.concat(connectionKeyPairs);
    await dispatch({
      type: UPDATE_CONNECTION_KEY_PAIRS,
      payload: resultConnectionKeys,
    });
    await dispatch(saveDbAction('connectionKeyPairs', { connectionKeyPairs: resultConnectionKeys }, true));
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

export const mapIdentityKeysAction = (connectionPreKeyCount: number, theWalletId?: ?string = null) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId = theWalletId } },
    } = getState();

    const currentConnectionKeyPairs = await dispatch(useConnectionKeyPairs(connectionPreKeyCount));
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

    const successfullConnectionMaps = [];
    const errorConnectionKeyMaps = [];
    const resultCurrentConnections = await api.mapIdentityKeys(connectionIdentityKeyMap);
    if (resultCurrentConnections) {
      resultCurrentConnections.forEach((conn) => {
        if (conn.userId) {
          successfullConnectionMaps.push(conn);
        } else {
          const { sourceIdentityKey, targetIdentityKey } = conn;
          const errorConnKey = currentConnectionKeyPairs.find((connKeyPair) => {
            return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
          });
          errorConnectionKeyMaps.push(errorConnKey);
        }
      });
    }
    if (successfullConnectionMaps.length > 0) {
      await dispatch(updateConnectionIdentityKeys(successfullConnectionMaps));
    }
    if (errorConnectionKeyMaps.length > 0) {
      await dispatch(prependConnectionKeyPairs(errorConnectionKeyMaps));
    }
  };
};

export const updateOldConnections = (oldConnectionCount: number, theWalletId?: ?string = null) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId = theWalletId } },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
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

    if (oldConnectionCount > 0) {
      const mappedOldContacts = mappedOldContactsAccessTokens
        .filter((res) => { return res.myAccessToken && res.userAccessToken; });

      const mappedOldInvitations = accessTokens
        .filter((res) => { return res.userAccessToken === '' || res.myAccessToken === ''; });

      const mappedOldConnections = mappedOldContacts.concat(mappedOldInvitations);
      const identityKeysOldConnections = await dispatch(useConnectionKeyPairs(mappedOldConnections.length));
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

      const successfullConnectionUpdates = [];
      const errorConnectionUpdates = [];
      const resultOldConnections = await api.updateIdentityKeys(oldConnectionsUpdateData);
      if (resultOldConnections) {
        resultOldConnections.forEach((conn) => {
          const { sourceIdentityKey, targetIdentityKey } = conn;
          if (conn.updated) {
            const successConKeyPair = identityKeysOldConnections.find((connKeyPair) => {
              return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
            });
            successfullConnectionUpdates.push(successConKeyPair);
          } else {
            const errorConnKeyPair = identityKeysOldConnections.find((connKeyPair) => {
              return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
            });
            errorConnectionUpdates.push(errorConnKeyPair);
          }
        });
      }
      if (errorConnectionUpdates.length > 0) {
        await dispatch(prependConnectionKeyPairs(errorConnectionUpdates));
      }
      if (successfullConnectionUpdates.length > 0) {
        const currentConnectionKeyPairList = successfullConnectionUpdates.map((keyPair) => {
          return {
            sourceIdentityKey: keyPair.A,
            targetIdentityKey: keyPair.Ad,
          };
        });
        const connectionIdentityKeyMap = {
          walletId,
          identityKeys: currentConnectionKeyPairList,
        };

        const successfullConnectionMaps = [];
        const resultCurrentConnections = await api.mapIdentityKeys(connectionIdentityKeyMap);
        if (resultCurrentConnections) {
          resultCurrentConnections.forEach((conn) => {
            if (conn.userId) {
              successfullConnectionMaps.push(conn);
            }
          });
        }
        if (successfullConnectionMaps.length > 0) {
          await dispatch(updateConnectionIdentityKeys(successfullConnectionMaps));
        }
      }
    }
  };
};

export const backgroundPreKeyGeneratorAction = (mnemonic: ?string, privateKey: ?string, insideRun?: ?boolean) => {
  return async (dispatch: Function, getState: Function) => {
    if (insideRun) {
      InteractionManager.runAfterInteractions(async () => {
        const { connectionKeyPairs: { data: connectionKeyPairs, lastConnectionKeyIndex } } = getState();
        if (connectionKeyPairs.length < 100) {
          const newKeyPairs =
            await generateKeyPairThreadPool(
              mnemonic,
              privateKey,
              0,
              0,
              lastConnectionKeyIndex);
          const resultConnectionKeys = connectionKeyPairs.concat(newKeyPairs);
          dispatch({
            type: UPDATE_CONNECTION_KEY_PAIRS,
            payload: resultConnectionKeys,
          });
          dispatch(saveDbAction('connectionKeyPairs', { connectionKeyPairs: resultConnectionKeys }, true));
          dispatch(backgroundPreKeyGeneratorAction(mnemonic, privateKey, true));
        }
      });
    } else {
      setTimeout(() => {
        dispatch(backgroundPreKeyGeneratorAction(mnemonic, privateKey, true));
      }, 10000);
    }
  };
};

export const updateConnectionKeyPairs = (
  mnemonic: ?string,
  privateKey: ?string,
  walletId: string,
  generateKeys: boolean = true,
) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      connectionKeyPairs: { data: connectionKeyPairs, lastConnectionKeyIndex },
      connectionIdentityKeys: { data: connectionIdentityKeys },
    } = getState();

    const numberOfConnections = await api.connectionsCount(walletId);
    if (!numberOfConnections) {
      return Promise.resolve(false);
    }

    const { currentConnectionsCount, oldConnectionsCount, newReceivedConnectonsCount } = numberOfConnections;
    const totalConnections = currentConnectionsCount + oldConnectionsCount + newReceivedConnectonsCount;

    if (oldConnectionsCount > 0 || currentConnectionsCount > connectionIdentityKeys.length) {
      if (generateKeys) {
        await dispatch({
          type: UPDATE_WALLET_STATE,
          payload: GENERATING_CONNECTIONS,
        });

        try {
          if (lastConnectionKeyIndex === -1) {
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
          }
        } catch (e) {
          await dispatch({
            type: UPDATE_WALLET_STATE,
            payload: DECRYPTED,
          });
        }
      }
      await dispatch(fetchOldInviteNotificationsAction(walletId));
      await dispatch(restoreAccessTokensAction(walletId));
      await dispatch(mapIdentityKeysAction(totalConnections + 25, walletId));
      await dispatch(updateOldConnections(oldConnectionsCount, walletId));
    }

    await dispatch(updateConnectionsAction(walletId));

    if (generateKeys) {
      dispatch(backgroundPreKeyGeneratorAction(mnemonic, privateKey));
    }

    return Promise.resolve(true);
  };
};
