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
import { TYPE_SENT, UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { GENERATING_CONNECTIONS, UPDATE_WALLET_STATE } from 'constants/walletConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { updateConnectionKeyPairs, useConnectionKeyPairs } from 'actions/connectionKeyPairActions';
import * as keyPairUtils from 'utils/keyPairGenerator';
import * as oldInvitationsActions from 'actions/oldInvitationsActions';


const walletId = 'walletId';
const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';

const mockConnectionKeyPairs = [
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

const mockAccessTokens = [
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

const mockContacts = [
  {
    id: 2,
    ethAddress: '0x002',
    username: 'oldConnection',
    profileImage: 'https://google.com/logo.png',
    createdAt: 111111111,
    updatedAt: 111111112,
  },
];

const mockInvitations = [
  {
    id: 4,
    username: 'user4',
    connectionKey: '333',
    profileImage: 'profileImgUrl4',
    type: TYPE_SENT,
    createdAt: 4444444444,
  },
];

const mockConnectionCountResponse = { currentConnectionsCount: 4, oldConnectionsCount: 2 };

const mockUpdateIdentityKeysResponse = [
  {
    sourceUserAccessKey: '111',
    targetUserAccessKey: '222',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890111',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890112',
    updated: true,
  },
  {
    sourceUserAccessKey: '333',
    targetUserAccessKey: '444',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890222',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890223',
    updated: true,
  },
];

const mockConnectionIdentityKeys = [];

const mockMapIdentityKeysResponse = [
  {
    userId: 1,
    targetUserId: 2,
    sourceUserAccessKey: '111',
    targetUserAccessKey: '222',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890111',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890112',
    status: 'accepted',
    createdAt: 1111111111,
    updatedAt: 1111111112,
    targetUserInfo: {
      userId: 2,
      username: 'oldConnectionMigrated',
      profileImage: 'profileImgUrl',
      profileLargeImage: '',
      ethAddress: '0x002',
    },
  },
  {
    userId: 1,
    targetUserId: 4,
    sourceUserAccessKey: '333',
    targetUserAccessKey: '444',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890222',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890223',
    status: 'pending',
    createdAt: 4444444444,
    updatedAt: 4444444445,
    targetUserInfo: {
      userId: 4,
      username: 'user4',
      profileImage: 'profileImgUrl4',
      profileLargeImage: '',
      ethAddress: '0x004',
    },
  },
  {
    userId: 1,
    targetUserId: 3,
    sourceUserAccessKey: '131',
    targetUserAccessKey: '313',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890333',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890334',
    status: 'accepted',
    createdAt: 3333333333,
    updatedAt: 3333333334,
    targetUserInfo: {
      userId: 3,
      username: 'user3',
      profileImage: 'profileImgUrl3',
      profileLargeImage: '',
      ethAddress: '0x003',
    },
  },
  {
    userId: 1,
    targetUserId: 5,
    sourceUserAccessKey: '151',
    targetUserAccessKey: '515',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890444',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890445',
    status: 'accepted',
    createdAt: 5555555555,
    updatedAt: 5555555556,
    targetUserInfo: {
      userId: 5,
      username: 'user5',
      profileImage: 'profileImgUrl5',
      profileLargeImage: '',
      ethAddress: '0x005',
    },
  },
  {
    userId: 1,
    targetUserId: 6,
    sourceUserAccessKey: '161',
    targetUserAccessKey: '616',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890555',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890556',
    status: 'accepted',
    createdAt: 6666666666,
    updatedAt: 6666666667,
    targetUserInfo: {
      userId: 6,
      username: 'user6',
      profileImage: 'profileImgUrl6',
      profileLargeImage: '',
      ethAddress: '0x006',
    },
  },
  {
    userId: 1,
    targetUserId: 7,
    sourceUserAccessKey: '171',
    targetUserAccessKey: '717',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890666',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890667',
    status: 'accepted',
    createdAt: 7777777777,
    updatedAt: 7777777778,
    targetUserInfo: {
      userId: 7,
      username: 'user7',
      profileImage: 'profileImgUrl7',
      profileLargeImage: '',
      ethAddress: '0x007',
    },
  },
];

jest.mock('services/api', () => jest.fn().mockImplementation(() => ({
  fetchAccessTokens: jest.fn(),
  fetchNotifications: jest.fn(),
  patchIdentityKeys: jest.fn(),
  connectionsCount: jest.fn((walletIdParam) => {
    if (walletIdParam) {
      return mockConnectionCountResponse;
    }
    return null;
  }),
  updateIdentityKeys: jest.fn((updatedIdentityKeys: ConnectionUpdateIdentityKeys) => {
    if (updatedIdentityKeys) {
      return mockUpdateIdentityKeysResponse;
    }
    return null;
  }),
  mapIdentityKeys: jest.fn((connectionKeyIdentityMap: ConnectionIdentityKeyMap) => {
    if (connectionKeyIdentityMap) {
      const { identityKeys } = connectionKeyIdentityMap;
      return mockMapIdentityKeysResponse.filter(({
        sourceIdentityKey: mapSourceIdentityKey,
        targetIdentityKey: mapTargetIdentityKey,
      }) => identityKeys.find(({ sourceIdentityKey, targetIdentityKey }) =>
        sourceIdentityKey === mapSourceIdentityKey && targetIdentityKey === mapTargetIdentityKey,
      ));
    }
    return null;
  }),
})));

const pillarSdk = new PillarSdk();

const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

describe('ConnectionKeyPair actions', () => {
  let store;

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    storage.save('connectionKeyPairs', { connectionKeyPairs: [] });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    const connectionKeyPairsStoreMock = {
      connectionKeyPairs: {
        data: [...mockConnectionKeyPairs],
        lastConnectionKeyIndex: -1,
      },
      accessTokens: {
        data: [...mockAccessTokens],
      },
      contacts: {
        data: [...mockContacts],
      },
      invitations: {
        data: [...mockInvitations],
      },
      user: {
        data: { walletId },
      },
      featureFlags: {
        data: {
          SMART_WALLET_ENABLED: false,
        },
      },
      connectionIdentityKeys: {
        data: mockConnectionIdentityKeys,
      },
    };
    store = mockStore({ ...connectionKeyPairsStoreMock });
  });

  it('should expect series of actions with payload to be dispatched on first updateConnectionKeyPairs execution',
    () => {
      // TODO : The second call to UPDATE_CONNECTION_KEY_PAIRS should have 5 elements, state is not updated.
      const expectedActions = [
        { type: UPDATE_WALLET_STATE, payload: GENERATING_CONNECTIONS },
        { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...mockConnectionKeyPairs] },
        { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...mockConnectionKeyPairs.slice(3, 7)] },
        { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...mockConnectionKeyPairs.slice(3, 7)] },
        { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: mockMapIdentityKeysResponse.slice(0, 2) },
        { type: UPDATE_INVITATIONS, payload: [...mockInvitations] },
        { type: UPDATE_CONTACTS, payload: [...mockContacts] },
        { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: [] },
        { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...mockConnectionKeyPairs.slice(3, 7)] },
        { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...mockConnectionKeyPairs.slice(2, 7)] },
      ];

      // $FlowFixMe
      keyPairUtils.generateKeyPairThreadPool = jest.fn(() => { return Promise.resolve([]); });
      // $FlowFixMe
      oldInvitationsActions.fetchOldInviteNotificationsAction = () => async () => Promise.resolve(true);

      return store.dispatch(updateConnectionKeyPairs(mnemonic, privateKey, walletId))
        .then(() => {
          const actualActions = store.getActions();
          expect(actualActions).toEqual(expectedActions);
        });
    });

  it('Should expect state to have one used keyPair when using 1 connectionKeyPair from the pre-keys pool', () => {
    const expectedActions = [
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...mockConnectionKeyPairs].slice(1, 7) },
    ];
    return store.dispatch(useConnectionKeyPairs(1))
      .then((result) => {
        const actualActions = store.getActions();
        const actualState = store.getState();
        expect(actualActions).toEqual(expectedActions);
        expect(actualState.connectionKeyPairs.data.length).toEqual(mockConnectionKeyPairs.length - 1);
        expect(result.length).toEqual(1);
      });
  });
});
