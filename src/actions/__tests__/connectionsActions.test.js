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
import type { ConnectionIdentityKeyMap } from 'models/Connections';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { TYPE_SENT, UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { updateConnectionsAction } from 'actions/connectionsActions';

const walletId = 'walletId';

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

const mockMapIdentityKeysResponse = [
  {
    userId: 1,
    targetUserId: 2,
    sourceUserAccessKey: '111',
    targetUserAccessKey: '222',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890111',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890112',
    status: 'accepted',
    createdAt: '2019-04-17T08:57:54.547Z',
    updatedAt: '2019-04-17T08:57:54.547Z',
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
    createdAt: '2019-04-17T08:57:54.547Z',
    updatedAt: '2019-04-17T08:57:54.547Z',
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
    createdAt: '2019-04-17T08:57:54.547Z',
    updatedAt: '2019-04-17T08:57:54.547Z',
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
    createdAt: '2019-04-17T08:57:54.547Z',
    updatedAt: '2019-04-17T08:57:54.547Z',
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
    createdAt: '2019-04-17T08:57:54.547Z',
    updatedAt: '2019-04-17T08:57:54.547Z',
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
    createdAt: '2019-04-17T08:57:54.547Z',
    updatedAt: '2019-04-17T08:57:54.547Z',
    targetUserInfo: {
      userId: 7,
      username: 'user7',
      profileImage: 'profileImgUrl7',
      profileLargeImage: '',
      ethAddress: '0x007',
    },
  },
];

const mockContactsResult = [
  {
    id: 2,
    ethAddress: '0x002',
    username: 'oldConnectionMigrated',
    profileImage: 'profileImgUrl',
    createdAt: 1555491474.547,
    updatedAt: 1555491474.547,
    status: 'accepted',
  },
  {
    id: 3,
    ethAddress: '0x003',
    username: 'user3',
    profileImage: 'profileImgUrl3',
    createdAt: 1555491474.547,
    updatedAt: 1555491474.547,
    status: 'accepted',
  },
  {
    id: 5,
    ethAddress: '0x005',
    username: 'user5',
    profileImage: 'profileImgUrl5',
    createdAt: 1555491474.547,
    updatedAt: 1555491474.547,
    status: 'accepted',
  },
  {
    id: 6,
    ethAddress: '0x006',
    username: 'user6',
    profileImage: 'profileImgUrl6',
    createdAt: 1555491474.547,
    updatedAt: 1555491474.547,
    status: 'accepted',
  },
  {
    id: 7,
    ethAddress: '0x007',
    username: 'user7',
    profileImage: 'profileImgUrl7',
    createdAt: 1555491474.547,
    updatedAt: 1555491474.547,
    status: 'accepted',
  },
];

const mockInvitationsResult = [
  {
    id: 4,
    username: 'user4',
    connectionKey: '333',
    profileImage: 'profileImgUrl4',
    type: TYPE_SENT,
    createdAt: 4444444444,
    sourceUserIdentityKeys: {
      sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890222',
      targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890223',
    },
    targetUserIdentityKeys: {
      sourceIdentityKey: undefined,
      targetIdentityKey: undefined,
    },
  },
];

jest.mock('services/api', () => jest.fn().mockImplementation(() => ({
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

describe('Connections Actions tests', () => {
  let store;

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    storage.save('connectionKeyPairs', { connectionKeyPairs: [] });
  });

  beforeEach(() => {
    const connectionKeyPairsStoreMock = {
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
        data: [...mockMapIdentityKeysResponse],
      },
    };
    store = mockStore({ ...connectionKeyPairsStoreMock });
  });

  it('Should expect processed contacts and invitations by the mapIdentityKeys result from api', () => {
    const expectedActions = [
      { type: UPDATE_INVITATIONS, payload: mockInvitationsResult },
      { type: UPDATE_CONTACTS, payload: mockContactsResult },
      { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: [...mockMapIdentityKeysResponse] },
    ];
    return store.dispatch(updateConnectionsAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
