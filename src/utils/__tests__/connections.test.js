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
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { getIdentityKeyPairs } from 'utils/connections';

const connectionKeyPairsMock = [
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890108',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890118',
    connIndex: 2,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890229',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890239',
    connIndex: 3,
  },
  {
    A: '0x0123456789012345678901234567890123456789012345678901234567890310',
    Ad: '0x0123456789012345678901234567890123456789012345678901234567890311',
    connIndex: 4,
  },
];

const mapIdentityKeysResponseMock = [
  {
    userId: '1',
    targetUserId: '3',
    sourceUserAccessKey: '333',
    targetUserAccessKey: '444',
    sourceIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890222',
    targetIdentityKey: '0x0123456789012345678901234567890123456789012345678901234567890223',
    status: 'cancelled',
    createdAt: '2019-04-17T08:57:54.547Z',
    updatedAt: '2019-04-17T08:57:54.547Z',
    targetUserInfo: {
      userId: '3',
      username: 'user3',
      profileImage: 'profileImgUrl3',
      profileLargeImage: '',
      ethAddress: '0x003',
    },
  },
];

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);

describe('Connections Utility function tests', () => {
  let store;

  beforeEach(() => {
    const connectionKeyPairsStoreMock = {
      connectionIdentityKeys: {
        data: [...mapIdentityKeysResponseMock],
      },
      connectionKeyPairs: {
        data: [...connectionKeyPairsMock],
      },
    };
    store = mockStore({ ...connectionKeyPairsStoreMock });
  });

  it('Should call getIdentityKeyPairs and reuse a connectionKeyPair from the state if available.', () => {
    const expectedActions = [];
    return getIdentityKeyPairs('3', mapIdentityKeysResponseMock, store.dispatch)
      .then((result) => {
        const actualActions = store.getActions();
        expect(result.connIdKeyResult).toEqual(mapIdentityKeysResponseMock[0]);
        expect(actualActions).toEqual(expectedActions);
      });
  });

  it('Should call getIdentityKeyPairs and use a new connectionKeyPair dispatch the action.', () => {
    const expectedActions = [
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [connectionKeyPairsMock[1], connectionKeyPairsMock[2]] },
    ];
    return getIdentityKeyPairs('4', mapIdentityKeysResponseMock, store.dispatch)
      .then((result) => {
        const actualActions = store.getActions();
        expect(result.connKeyPairReserved).toEqual([connectionKeyPairsMock[0]]);
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
