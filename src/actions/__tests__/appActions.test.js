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
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { initAppAndRedirectAction } from '../appActions';

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);
describe('App actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore({});
  });

  it(`initAppAndRedirectAction - should trigger the app settings updated 
  with any redirection due to the empty storage`, () => {
    const expectedActions = [
      { type: UPDATE_APP_SETTINGS, payload: {} },
    ];

    return store.dispatch(initAppAndRedirectAction('ios', 'active'))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
