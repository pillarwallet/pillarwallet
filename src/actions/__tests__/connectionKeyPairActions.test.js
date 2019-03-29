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
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';
import Storage from 'services/storage';
import PillarSdk from 'services/api';
import type { ConnectionIdentityKeyMap, ConnectionUpdateIdentityKeys } from 'models/Connections';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { updateConnectionKeyPairs, useConnectionKeyPairs } from 'actions/connectionKeyPairActions';
import * as keyPairUtils from 'utils/keyPairGenerator';

const walletId = 'walletId';
const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
const connectionKeyPairsMock = [
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890111',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890112',
    connIndex: 1,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890222',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890223',
    connIndex: 2,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890333',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890334',
    connIndex: 3,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890444',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890445',
    connIndex: 4,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890555',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890556',
    connIndex: 5,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890666',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890667',
    connIndex: 6,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890777',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890778',
    connIndex: 7,
  },
];

const accessTokensMock = [
  {
    myAccessToken: '111',
    userAccessToken: '222',
    userId: 2,
    status: 'accepted',
  },
  {
    myAccessToken: '333',
    userAccessToken: '',
    userId: 4,
    status: 'pending',
  },
];

const contactsMock = [
  {
    id: 2,
    username: 'myContact',
  },
];

const connectionIdentityKeysMock = [];

const connectionCountResponseMock = { currentConnectionsCount: 4, oldConnectionsCount: 2 };
const updateIdentityKeysResponseMock = [{ updated: true }, { updated: true }];
const mapIdentityKeysResponseMock = [
  {
    userId: 1,
    targetUserId: 2,
    sourceUserAccessKey: '111',
    targetUserAccessKey: '222',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890111',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890112',
    status: 'accepted',
  },
  {
    userId: 1,
    targetUserId: 4,
    sourceUserAccessKey: '333',
    targetUserAccessKey: '',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890222',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890223',
    status: 'pending',
  },
  {
    userId: 1,
    targetUserId: 3,
    sourceUserAccessKey: '131',
    targetUserAccessKey: '313',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890333',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890334',
    status: 'accepted',
  },
  {
    userId: 1,
    targetUserId: 5,
    sourceUserAccessKey: '151',
    targetUserAccessKey: '515',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890444',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890445',
    status: 'accepted',
  },
  {
    userId: 1,
    targetUserId: 6,
    sourceUserAccessKey: '161',
    targetUserAccessKey: '616',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890555',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890556',
    status: 'accepted',
  },
  {
    userId: 1,
    targetUserId: 7,
    sourceUserAccessKey: '171',
    targetUserAccessKey: '717',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890666',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890667',
    status: 'accepted',
  },
];

type SDK = {
  connectionsCount: Function,
  updateIdentityKeys: Function,
  mapIdentityKeys: Function,
};

const pillarSdk: SDK = new PillarSdk();
pillarSdk.connectionsCount = jest.fn((walletIdParam) => {
  if (walletIdParam) {
    return connectionCountResponseMock;
  }
  return null;
});
pillarSdk.updateIdentityKeys = jest.fn((updatedIdentityKeys: ConnectionUpdateIdentityKeys) => {
  if (updatedIdentityKeys) {
    return updateIdentityKeysResponseMock;
  }
  return null;
});
pillarSdk.mapIdentityKeys = jest.fn((connectionKeyIdentityMap: ConnectionIdentityKeyMap) => {
  if (connectionKeyIdentityMap) {
    return mapIdentityKeysResponseMock;
  }
  return null;
});

const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

describe('ConnectionKeyPair actions', () => {
  let store;

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    storage.save('connectionKeyPairs', { connectionKeyPairs: [] });
  });

  beforeEach(() => {
    const connectionKeyPairsStoreMock = {
      connectionKeyPairs: {
        data: [...connectionKeyPairsMock],
        lastConnectionKeyIndex: -1,
      },
      accessTokens: {
        data: [...accessTokensMock],
      },
      contacts: {
        data: [...contactsMock],
      },
      user: {
        data: { walletId },
      },
      connectionIdentityKeys: {
        data: connectionIdentityKeysMock,
      },
    };
    store = mockStore(connectionKeyPairsStoreMock);
  });

  it('should expect series of actions with payload to be dispatched on first updateConnectionKeyPairs execution',
    () => {
      const expectedActions = [
        { type: UPDATE_CONNECTION_KEY_PAIRS, payload: connectionKeyPairsMock },
        { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: mapIdentityKeysResponseMock },
        { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [connectionKeyPairsMock[6]] },
      ];

      // $FlowFixMe
      keyPairUtils.generateKeyPairThreadPool = jest.fn(() => { return Promise.resolve([]); });

      return store.dispatch(updateConnectionKeyPairs(mnemonic, privateKey, walletId))
        .then(() => {
          const actualActions = store.getActions();
          expect(actualActions).toEqual(expectedActions);
        });
    });

  it('Should expect state to have one used keyPair when using 1 connectionKeyPair from the pre-keys pool', () => {
    const expectedActions = [
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...connectionKeyPairsMock].slice(1, 7) },
    ];
    return store.dispatch(useConnectionKeyPairs(1))
      .then((result) => {
        const actualActions = store.getActions();
        const actualState = store.getState();
        expect(actualActions).toEqual(expectedActions);
        expect(actualState.connectionKeyPairs.data.length).toEqual(connectionKeyPairsMock.length - 1);
        expect(result.length).toEqual(1);
      });
  });
});
