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
import { delay } from 'utils/common';
import { saveDbAction } from '../dbActions';

jest.setTimeout(20000);

const storage = Storage.getInstance('db');

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);
describe('DB actions', () => {
  let store;
  let count = 0;
  beforeAll((done) => {
    store = mockStore({});
    const timer = setInterval(() => {
      if (count === 30) {
        clearInterval(timer);
        done();
        return;
      }

      count++;
      // UNCOMMENT only for test purposes to see test failing
      // storage.save('app_settings', { appSettings: { userId: count } }, true);
      store.dispatch(saveDbAction('app_settings', { appSettings: { userId: count } }, true));
    }, 10);
  });

  it('The userId should be equal to the latest count value', async () => {
    await delay(5000);
    const { appSettings: { userId } } = await storage.get('app_settings');
    expect(userId).toEqual(count);
  });
});
