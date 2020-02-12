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
import { generateKeyPairThreadPool, generateKeyPairPool } from 'utils/keyPairGenerator';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { GENERATING_CONNECTIONS, UPDATE_WALLET_STATE, DECRYPTED } from 'constants/walletConstants';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import type { ConnectionIdentityKey } from 'models/Connections';
import { restoreAccessTokensAction } from 'actions/onboardingActions';
import { fetchOldInviteNotificationsAction } from 'actions/oldInvitationsActions';
import { updateConnectionsAction } from 'actions/connectionsActions';
import SDKWrapper from 'services/api';
import { saveDbAction } from 'actions/dbActions';

import type { Dispatch, GetState } from 'reducers/rootReducer';

export const useConnectionKeyPairs = (count: number = 1) => {
  return async (dispatch: Dispatch, getState: GetState) => {
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
  return async (dispatch: Dispatch, getState: GetState) => {
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

export const updateConnectionIdentityKeys = (successfulConnIdentityKeys: Object[]) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { connectionIdentityKeys: { data: connectionIdentityKeys } } = getState();
    const resultConnectionIdentityKeys = connectionIdentityKeys.concat(successfulConnIdentityKeys);
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
  return async (dispatch: Function, getState: GetState, api: Object) => {
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

    const successfulConnectionMaps = [];
    const errorConnectionKeyMaps = [];
    const resultCurrentConnections = await api.mapIdentityKeys(connectionIdentityKeyMap);
    if (resultCurrentConnections) {
      resultCurrentConnections.forEach((conn) => {
        if (conn.userId) {
          successfulConnectionMaps.push(conn);
        } else {
          const { sourceIdentityKey, targetIdentityKey } = conn;
          const errorConnKey = currentConnectionKeyPairs.find((connKeyPair) => {
            return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
          });
          if (errorConnKey) errorConnectionKeyMaps.push(errorConnKey);
        }
      });
    } else if (resultCurrentConnections && resultCurrentConnections.length === 0) {
      errorConnectionKeyMaps.push(...currentConnectionKeyPairs);
    }
    if (successfulConnectionMaps.length > 0) {
      await dispatch(updateConnectionIdentityKeys(successfulConnectionMaps));
    }
    if (errorConnectionKeyMaps.length > 0) {
      await dispatch(prependConnectionKeyPairs(errorConnectionKeyMaps));
    }
  };
};

export const updateOldConnections = (oldConnectionCount: number, theWalletId?: ?string = null) => {
  return async (dispatch: Function, getState: GetState, api: Object) => {
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

      const successfulConnectionUpdates = [];
      const errorConnectionUpdates = [];
      const resultOldConnections = await api.updateIdentityKeys(oldConnectionsUpdateData);
      if (resultOldConnections) {
        resultOldConnections.forEach((conn) => {
          const { sourceIdentityKey, targetIdentityKey } = conn;
          if (conn.updated) {
            const successConKeyPair = identityKeysOldConnections.find((connKeyPair) => {
              return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
            });
            if (successConKeyPair) successfulConnectionUpdates.push(successConKeyPair);
          } else {
            const errorConnKeyPair = identityKeysOldConnections.find((connKeyPair) => {
              return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
            });
            if (errorConnKeyPair) errorConnectionUpdates.push(errorConnKeyPair);
          }
        });
      } else {
        errorConnectionUpdates.push(...identityKeysOldConnections);
      }
      if (errorConnectionUpdates.length > 0) {
        await dispatch(prependConnectionKeyPairs(errorConnectionUpdates));
      }
      if (successfulConnectionUpdates.length > 0) {
        const currentConnectionKeyPairList = successfulConnectionUpdates.map((keyPair) => {
          return {
            sourceIdentityKey: keyPair.A,
            targetIdentityKey: keyPair.Ad,
          };
        });
        const connectionIdentityKeyMap = {
          walletId,
          identityKeys: currentConnectionKeyPairList,
        };

        const successfulConnectionMaps = [];
        const resultCurrentConnections = await api.mapIdentityKeys(connectionIdentityKeyMap);
        if (resultCurrentConnections) {
          resultCurrentConnections.forEach((conn) => {
            if (conn.userId) {
              successfulConnectionMaps.push(conn);
            }
          });
        }
        if (successfulConnectionMaps.length > 0) {
          await dispatch(updateConnectionIdentityKeys(successfulConnectionMaps));
        }
      }
    }
  };
};

export const backgroundPreKeyGeneratorAction = (mnemonic: ?string, privateKey: ?string, insideRun?: ?boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
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

const patchConnections = (theWalletId?: ?string = null) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId = theWalletId } },
      connectionIdentityKeys: { data: connectionIdentityKeys },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
    } = getState();

    const patchContactsList = contacts.filter(contact =>
      !connectionIdentityKeys.some((cik: ConnectionIdentityKey) => cik.targetUserId === contact.id));

    const finalPatchList = patchContactsList.map(conn => {
      const contactAccessToken = accessTokens.find(at => at.userId === conn.id);
      return {
        accessTokens: contactAccessToken,
        targetUserId: conn.id,
        username: conn.username,
      };
    });

    const identityKeysPatchConnections = await dispatch(useConnectionKeyPairs(finalPatchList.length));
    const patchConnectionsUpdateList = identityKeysPatchConnections.map((keyPair, index) => {
      if (finalPatchList[index].accessTokens) {
        return {
          sourceUserAccessKey: finalPatchList[index].accessTokens.myAccessToken,
          targetUserAccessKey: finalPatchList[index].accessTokens.userAccessToken,
          sourceIdentityKey: keyPair.A,
          targetIdentityKey: keyPair.Ad,
          targetUserId: finalPatchList[index].targetUserId,
        };
      }
      return {
        sourceUserAccessKey: null,
        targetUserAccessKey: null,
        sourceIdentityKey: keyPair.A,
        targetIdentityKey: keyPair.Ad,
        targetUserId: finalPatchList[index].targetUserId,
      };
    });
    const patchConnectionsUpdateData = {
      walletId,
      connections: patchConnectionsUpdateList,
    };

    const successfulConnectionUpdates = [];
    const errorConnectionUpdates = [];
    const resultPatchConnections = await api.patchIdentityKeys(patchConnectionsUpdateData);
    if (resultPatchConnections) {
      resultPatchConnections.forEach((conn) => {
        const { sourceIdentityKey, targetIdentityKey } = conn;
        if (conn.updated) {
          const successConKeyPair = identityKeysPatchConnections.find((connKeyPair) => {
            return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
          });
          if (successConKeyPair) successfulConnectionUpdates.push(successConKeyPair);
        } else {
          const errorConnKeyPair = identityKeysPatchConnections.find((connKeyPair) => {
            return connKeyPair.A === sourceIdentityKey && connKeyPair.Ad === targetIdentityKey;
          });
          if (errorConnKeyPair) errorConnectionUpdates.push(errorConnKeyPair);
        }
      });
    } else {
      errorConnectionUpdates.push(...identityKeysPatchConnections);
    }
    if (errorConnectionUpdates.length > 0) {
      await dispatch(prependConnectionKeyPairs(errorConnectionUpdates));
    }
    if (successfulConnectionUpdates.length > 0) {
      const currentConnectionKeyPairList = successfulConnectionUpdates.map(keyPair => ({
        sourceIdentityKey: keyPair.A,
        targetIdentityKey: keyPair.Ad,
      }));
      const connectionIdentityKeyMap = {
        walletId,
        identityKeys: currentConnectionKeyPairList,
      };

      const successfulConnectionMaps = [];
      const resultCurrentConnections = await api.mapIdentityKeys(connectionIdentityKeyMap);
      if (resultCurrentConnections) {
        resultCurrentConnections.forEach(conn => conn.userId && successfulConnectionMaps.push(conn));
      }
      if (successfulConnectionMaps.length > 0) {
        await dispatch(updateConnectionIdentityKeys(successfulConnectionMaps));
      }
    }
  };
};

export const updateConnectionKeyPairs = (
  mnemonic: ?string,
  privateKey: ?string,
  walletId: string,
  generateKeys: boolean = true,
) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
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

    if (generateKeys && totalConnections === 0 && connectionKeyPairs.length === 0 && lastConnectionKeyIndex === -1) {
      /* NOTE: -1 would be no keys generated yet at all, 0 for connections number in order not to overgenerate those 2
       ( countToGenerate + connectionsCount in the function algorithm otherwise). These 2 are added in the
       blocking(in progress) screen just in case a user connects to a target
       before the background task kicks in - 10 seconds after this initial generation. */
      const promiseJobs = await generateKeyPairPool(mnemonic, privateKey, -1, 0, 2);
      const resultPairs = await Promise.all(promiseJobs.map(task => task()));
      const allPairsResults = [].concat(...resultPairs);
      const initialConnKeyPairs = allPairsResults.sort((a, b) => a.connIndex < b.connIndex ? -1 : 1);
      await dispatch({
        type: UPDATE_CONNECTION_KEY_PAIRS,
        payload: initialConnKeyPairs,
      });
      await dispatch(saveDbAction('connectionKeyPairs', { connectionKeyPairs: initialConnKeyPairs }, true));
    }

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

    await dispatch(patchConnections(walletId));

    if (generateKeys) {
      dispatch(backgroundPreKeyGeneratorAction(mnemonic, privateKey));
    }

    return Promise.resolve(true);
  };
};
