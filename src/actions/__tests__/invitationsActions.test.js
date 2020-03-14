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
import PillarSdk from 'services/api';
import type { ConnectionIdentityKeyMap } from 'models/Connections';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { TYPE_SENT, UPDATE_INVITATIONS, TYPE_RECEIVED } from 'constants/invitationsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import {
  sendInvitationAction,
  acceptInvitationAction,
  cancelInvitationAction,
  rejectInvitationAction,
} from 'actions/invitationsActions';

const walletId = 'walletId';

const contactsMock = [
  {
    id: 2,
    ethAddress: '0x002',
    username: 'oldConnection',
    profileImage: 'https://google.com/logo.png',
    createdAt: 111111111,
    updatedAt: 111111112,
  },
];

const apiUserMock = {
  id: '22',
  ethAddress: '0x0022',
  username: 'targetUsername',
  profileImage: 'https://google.com/logo.png',
  connectionKey: '222',
};

const invitationsMock = [
  {
    id: 4,
    username: 'user4',
    connectionKey: '333',
    profileImage: 'profileImgUrl4',
    type: TYPE_SENT,
    createdAt: 4444444444,
  },
  {
    id: 192,
    username: 'user192',
    connectionKey: '192',
    profileImage: 'profileImgUrl192',
    type: TYPE_RECEIVED,
    createdAt: 55555555192,
    sourceIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890665',
    sourceUserIdentityKeys: {
      sourceIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890665',
      targetIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890666',
    },
  },
  {
    id: 6,
    username: 'user6',
    connectionKey: '666',
    sourceIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890661',
    sourceUserIdentityKeys: {
      sourceIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890661',
      targetIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890662',
    },
    profileImage: 'profileImgUrl6',
    type: TYPE_RECEIVED,
    createdAt: 6666666666666,
  },
];

const connectionKeyPairsMock = [
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890108',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890118',
    connIndex: 8,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890229',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890239',
    connIndex: 9,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890310',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890311',
    connIndex: 10,
  },
];

const mapIdentityKeysResponseMock = [
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

const contactsResultMock = [
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

const invitationsResultMock = [
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
  {
    id: 192,
    username: 'user192',
    connectionKey: '192',
    profileImage: 'profileImgUrl192',
    type: TYPE_RECEIVED,
    createdAt: 55555555192,
    sourceIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890665',
    sourceUserIdentityKeys: {
      sourceIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890665',
      targetIdentityKey: '0x0993456789012345678901234567890123456789012345678901234567890666',
    },
  },
];

type SDK = {
  mapIdentityKeys: Function,
  sendInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  acceptInvitation: Function,
};

const pillarSdk = new PillarSdk();
pillarSdk.mapIdentityKeys = jest.fn((connectionKeyIdentityMap: ConnectionIdentityKeyMap) => {
  if (connectionKeyIdentityMap) {
    const { identityKeys } = connectionKeyIdentityMap;
    return mapIdentityKeysResponseMock.filter(({
      sourceIdentityKey: mapSourceIdentityKey,
      targetIdentityKey: mapTargetIdentityKey,
    }) => identityKeys.find(({ sourceIdentityKey, targetIdentityKey }) =>
      sourceIdentityKey === mapSourceIdentityKey && targetIdentityKey === mapTargetIdentityKey,
    ));
  }
  return null;
});
pillarSdk.sendInvitation = jest.fn((id) => id);
pillarSdk.acceptInvitation = jest.fn((id) => id);
pillarSdk.cancelInvitation = jest.fn((id) => id);
pillarSdk.rejectInvitation = jest.fn((id) => id);

const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

describe('Invitations Actions tests', () => {
  let store;

  beforeEach(() => {
    const connectionKeyPairsStoreMock = {
      contacts: {
        data: [...contactsMock],
      },
      invitations: {
        data: [...invitationsMock],
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
        data: [...mapIdentityKeysResponseMock],
      },
      connectionKeyPairs: {
        data: [...connectionKeyPairsMock],
      },
      accessTokens: {
        data: [],
      },
    };
    store = mockStore({ ...connectionKeyPairsStoreMock });
  });

  it('Should expect connection key reservation on sendInvitationAction.', () => {
    const expectedActions = [
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [connectionKeyPairsMock[2]] },
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...connectionKeyPairsMock] },
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [connectionKeyPairsMock[2]] },
      { type: ADD_NOTIFICATION, payload: { message: 'Invitation sent' } },
      { type: UPDATE_INVITATIONS, payload: invitationsResultMock },
      { type: UPDATE_CONTACTS, payload: contactsResultMock },
      { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: [...mapIdentityKeysResponseMock] },
    ];
    return store.dispatch(sendInvitationAction(apiUserMock))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should expect set of actions on acceptInvitationAction of new connections system.', () => {
    const expectedActions = [
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [connectionKeyPairsMock[2]] },
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [...connectionKeyPairsMock] },
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [connectionKeyPairsMock[2]] },
      { type: UPDATE_INVITATIONS, payload: [invitationsMock[0], invitationsMock[2]] },
      { type: ADD_NOTIFICATION, payload: { message: 'Connection request accepted' } },
      { type: UPDATE_INVITATIONS, payload: [invitationsResultMock[0], invitationsResultMock[1]] },
      { type: UPDATE_CONTACTS, payload: contactsResultMock },
      { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: [...mapIdentityKeysResponseMock] },
    ];
    return store.dispatch(acceptInvitationAction(invitationsMock[1]))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should expect set of actions on cancelInvitationAction of new connections system.', () => {
    const expectedActions = [
      { type: ADD_NOTIFICATION, payload: { message: 'Invitation cancelled' } },
      { type: UPDATE_INVITATIONS, payload: [invitationsMock[0], invitationsMock[1]] },
      { type: UPDATE_INVITATIONS, payload: [...invitationsResultMock] },
      { type: UPDATE_CONTACTS, payload: contactsResultMock },
      { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: [...mapIdentityKeysResponseMock] },
    ];
    return store.dispatch(cancelInvitationAction(invitationsMock[2]))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should expect set of actions on rejectInvitationAction of new connections system.', () => {
    const expectedActions = [
      { type: ADD_NOTIFICATION, payload: { message: 'Invitation rejected' } },
      { type: UPDATE_INVITATIONS, payload: [invitationsMock[0], invitationsMock[1]] },
      { type: UPDATE_INVITATIONS, payload: [...invitationsResultMock] },
      { type: UPDATE_CONTACTS, payload: contactsResultMock },
      { type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: [...mapIdentityKeysResponseMock] },
    ];
    return store.dispatch(rejectInvitationAction(invitationsMock[2]))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
