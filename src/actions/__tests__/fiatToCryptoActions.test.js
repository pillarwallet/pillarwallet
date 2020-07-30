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

import { SET_ALTALIX_INFO } from 'constants/fiatToCryptoConstants';
import { loadAltalixInfoAction } from 'actions/fiatToCryptoActions';

function mockStore({ state, pillarSdk }) {
  return configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue])(state);
}

describe('Fiat to crypto providers actions', () => {
  describe('Altalix', () => {
    it('loadAltalixInfoAction should set availability', async () => {
      const store = mockStore({
        state: {
          fiatToCrypto: { altalix: null },
        },
        pillarSdk: {
          fetchAltalixAvailability: async () => true,
        },
      });

      const expectedActions = [{ type: SET_ALTALIX_INFO, payload: { isAvailable: true } }];

      await store.dispatch(loadAltalixInfoAction());
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });
  });
});

