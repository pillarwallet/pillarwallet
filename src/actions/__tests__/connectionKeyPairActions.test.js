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
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { updateConnectionKeyPairs, useConnectionKeyPairs } from 'actions/connectionKeyPairActions';
import * as keyPairUtils from 'utils/keyPairGenerator';

const pillarSdk = {
  connectionsCount: jest.fn((walletIdParam) => {
    if (walletIdParam) {
      return {
        count: 0,
      };
    }
    return false;
  }),
};
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const walletId = 'walletId';
const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';

const connectionKeyPairsStoreMock = {
  connectionKeyPairs: {
    data: [{
      A: '0x0123456789012345678901234567890123456789012345678901234567890123',
      Ad: '0x0123456789012345678901234567890123456789012345678901234567890124',
      connIndex: 1,
    }],
    lastConnectionKeyIndex: 1,
  },
};

describe('ConnectionKeyPair actions', () => {
  let store;

  beforeAll(() => {
    const storage = Storage.getInstance('db');
    storage.save('connectionKeyPairs', { connectionKeyPairs: [] });
  });

  beforeEach(() => {
    store = mockStore(connectionKeyPairsStoreMock);
  });

  it('should expect series of actions with payload to be dispatch on updateConnectionKeyPairs execution', () => {
    const expectedActions = [
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: connectionKeyPairsStoreMock.connectionKeyPairs.data },
    ];

    // $FlowFixMe
    keyPairUtils.generateKeyPairThreadPool = jest.fn(() => { return Promise.resolve([]); });

    return store.dispatch(updateConnectionKeyPairs(mnemonic, privateKey, walletId))
      .then(() => {
        const actualActions = store.getActions();
        const actualState = store.getState();
        expect(actualActions).toEqual(expectedActions);
        expect(actualState).toEqual(connectionKeyPairsStoreMock);
      });
  });

  it('Should expect empty mock state list when using 1 connectionKeyPair from the pre-keys pool', () => {
    const expectedActions = [
      { type: UPDATE_CONNECTION_KEY_PAIRS, payload: [] },
    ];

    return store.dispatch(useConnectionKeyPairs(1))
      .then((result) => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
        expect(connectionKeyPairsStoreMock.connectionKeyPairs.data.length).toEqual(0);
        expect(result.length).toEqual(1);
      });
  });
});
