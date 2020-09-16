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
import { RESET_APP_LOADED, UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { CACHE_STATUS, SET_CACHE_MAP } from 'constants/cacheConstants';

import Storage from 'services/storage';
import { initAppAndRedirectAction } from 'actions/appActions';
import localeConfig from 'configs/localeConfig';
import { getDefaultSupportedUserLanguage } from 'services/localisation/translations';

const storage = Storage.getInstance('db');

const initialAppSettingsState = {
  data: {
    localisation: null,
  },
};

const initialSessionState = {
  data: {
    isOnline: true,
    areTranslationsInitialised: false,
  },
};

const initialCacheState = {
  cacheMap: {},
};


const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);
describe('App actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ appSettings: initialAppSettingsState, session: initialSessionState, cache: initialCacheState });
  });

  const defaultLanguage = getDefaultSupportedUserLanguage();
  const authTranslationsUrl = `${localeConfig.baseUrl}${defaultLanguage}/auth.json`;
  const commonTranslationsUrl = `${localeConfig.baseUrl}${defaultLanguage}/common.json`;


  it(`initAppAndRedirectAction - should trigger the app settings updated 
  with any redirection due to the empty storage`, async () => {
    await storage.save('storageSettings', { storageSettings: { pouchDBMigrated: true } });
    const expectedActions = [
      { type: RESET_APP_LOADED },
      { type: UPDATE_APP_SETTINGS, payload: {} },
      { type: SET_CACHE_MAP, payload: {} },
      { type: CACHE_STATUS.PENDING, payload: { url: authTranslationsUrl } },
      { type: CACHE_STATUS.PENDING, payload: { url: commonTranslationsUrl } },
      { type: CACHE_STATUS.DONE, payload: { url: authTranslationsUrl, localUrl: 'localString' } },
      { type: CACHE_STATUS.DONE, payload: { url: commonTranslationsUrl, localUrl: 'localString' } },
      { type: UPDATE_SESSION, payload: { fallbackLanguageVersion: 'LOCAL' } },
      { type: UPDATE_SESSION, payload: { areTranslationsInitialised: true } },
      { type: UPDATE_SESSION, payload: { sessionLanguageCode: localeConfig.defaultLanguage } },
    ];

    return store.dispatch(initAppAndRedirectAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
