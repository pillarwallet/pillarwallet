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
import { TYPE_SENT, UPDATE_INVITATIONS, TYPE_RECEIVED } from 'constants/invitationsConstants';
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
};

const invitationsMock = [
  {
    id: 4,
    username: 'user4',
    profileImage: 'profileImgUrl4',
    type: TYPE_SENT,
    createdAt: 4444444444,
  },
  {
    id: 192,
    username: 'user192',
    profileImage: 'profileImgUrl192',
    type: TYPE_RECEIVED,
    createdAt: 55555555192,
  },
  {
    id: 6,
    username: 'user6',
    profileImage: 'profileImgUrl6',
    type: TYPE_RECEIVED,
    createdAt: 6666666666666,
  },
];

const getContactsResponseMock = [
  {
    userId: 1,
    targetUserId: 2,
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

const invitationsResultMock = [
  {
    id: 4,
    username: 'user4',
    profileImage: 'profileImgUrl4',
    type: TYPE_SENT,
    createdAt: 4444444444,
  },
  {
    id: 192,
    username: 'user192',
    profileImage: 'profileImgUrl192',
    type: TYPE_RECEIVED,
    createdAt: 55555555192,
  },
];

type SDK = {
  getContacts: Function,
  sendInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  acceptInvitation: Function,
};

const pillarSdk: SDK = new PillarSdk();
pillarSdk.getContacts = jest.fn(() => [...getContactsResponseMock]);
pillarSdk.sendInvitation = jest.fn((id) => id);
pillarSdk.acceptInvitation = jest.fn((id) => id);
pillarSdk.cancelInvitation = jest.fn((id) => id);
pillarSdk.rejectInvitation = jest.fn((id) => id);
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

describe('Invitations Actions tests', () => {
  let store;

  beforeEach(() => {
    const storeMock = {
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
    };
    store = mockStore({ ...storeMock });
  });

  it('Should expect set of actions on sendInvitationAction.', () => {
    const expectedActions = [
      { type: ADD_NOTIFICATION, payload: { message: 'Invitation sent' } },
    ];
    return store.dispatch(sendInvitationAction(apiUserMock))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should expect set of actions on acceptInvitationAction.', () => {
    const expectedActions = [
      { type: UPDATE_INVITATIONS, payload: invitationsResultMock },
      { type: ADD_NOTIFICATION, payload: { message: 'Connection request accepted' } },
    ];
    return store.dispatch(acceptInvitationAction(invitationsMock[2]))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should expect set of actions on cancelInvitationAction.', () => {
    const expectedActions = [
      { type: ADD_NOTIFICATION, payload: { message: 'Invitation cancelled' } },
      { type: UPDATE_INVITATIONS, payload: invitationsResultMock },
    ];
    return store.dispatch(cancelInvitationAction(invitationsMock[2]))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should expect set of actions on rejectInvitationAction.', () => {
    const expectedActions = [
      { type: ADD_NOTIFICATION, payload: { message: 'Invitation rejected' } },
      { type: UPDATE_INVITATIONS, payload: invitationsResultMock },
    ];
    return store.dispatch(rejectInvitationAction(invitationsMock[2]))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
