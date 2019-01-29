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
import { ONBOARDING_FLOW } from 'constants/navigationConstants';
import Storage from 'services/storage';
import { confirmOTPAction } from '../signupActions';

const storage = Storage.getInstance('db'); // should utilise db from config once setup

const NAVIGATE = 'Navigation/NAVIGATE';
const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);
const store = mockStore({});
describe('Signup actions', () => {
  xit('should expect series of actions to be dispatch on confirmOTPAction execution including storage update', () => {
    const expectedActions = [
      { type: NAVIGATE, routeName: ONBOARDING_FLOW },
    ];

    return store.dispatch(confirmOTPAction('1111'))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
        return storage.get('app_settings');
      }).then((appSettings) => {
        expect(appSettings.OTP).toBeTruthy();
      });
  });
});
