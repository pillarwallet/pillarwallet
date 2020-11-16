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
import i18n from 'i18next';
import * as RNLocalize from 'react-native-localize';

import {
  getTranslationsResourcesAndSetLanguageOnAppOpenAction,
  getAndSetFallbackLanguageResources,
  changeLanguageAction,
} from 'actions/localisationActions';
import localeConfig from 'configs/localeConfig';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { firebaseRemoteConfig } from 'services/firebase';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { CACHE_STATUS } from 'constants/cacheConstants';
import {
  EN_EXTERNAL_TEST_TRANSLATION,
  FR_EXTERNAL_TEST_TRANSLATION,
  TEST_TRANSLATIONS_BASE_URL,
  TEST_TRANSLATIONS_TIME_STAMP,
} from 'constants/localesConstants';

const EN_LOCAL_TEST_TRANSLATION = 'En local translation';
const FR_LOCAL_TEST_TRANSLATION = 'Fr local translation';
const LT_LOCAL_TEST_TRANSLATION = 'Lt local translation';
const FR_ONLY_LOCAL_TEST_TRANSLATION = 'Fr only local value';
const ONLY_LOCAL_TRANSLATION = 'Only local translation';
const LNG_LOCAL_ONLY = 'lt_FAIL_FETCH'; // FAIL_FETCH to fail rn-fetch-blob fetch;

const expectedLocalTranslationInitActions = [
  {
    type: UPDATE_SESSION,
    payload: { fallbackLanguageVersion: 'LOCAL' },
  },
  {
    type: UPDATE_SESSION,
    payload: { translationsInitialised: true },
  },
  {
    type: UPDATE_SESSION,
    payload: { sessionLanguageCode: 'fr', sessionLanguageVersion: 'LOCAL' },
  },
];

const expectedExternalTranslationInitSessionActions = [
  {
    type: UPDATE_SESSION,
    payload: { fallbackLanguageVersion: TEST_TRANSLATIONS_TIME_STAMP },
  },
  {
    type: UPDATE_SESSION,
    payload: { translationsInitialised: true },
  },
  {
    type: UPDATE_SESSION,
    payload: { sessionLanguageCode: 'fr', sessionLanguageVersion: TEST_TRANSLATIONS_TIME_STAMP },
  },
];

const expectedExternalLtTranslationsFetchFailActions = [
  {
    type: CACHE_STATUS.PENDING,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}${LNG_LOCAL_ONLY}/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
  {
    type: CACHE_STATUS.PENDING,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}${LNG_LOCAL_ONLY}/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
  {
    type: CACHE_STATUS.FAILED,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}${LNG_LOCAL_ONLY}/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
  {
    type: CACHE_STATUS.FAILED,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}${LNG_LOCAL_ONLY}/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
];

const expectedExternalFrTranslationsFetchActions = [
  {
    type: CACHE_STATUS.PENDING,
    payload: { url: `${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json` },
  },
  {
    type: CACHE_STATUS.PENDING,
    payload: { url: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json` },
  },
  {
    type: CACHE_STATUS.DONE,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
  {
    type: CACHE_STATUS.DONE,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
];

const expectedExternalEnTranslationsFetchActions = [
  {
    type: CACHE_STATUS.PENDING,
    payload: { url: `${TEST_TRANSLATIONS_BASE_URL}en/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json` },
  },
  {
    type: CACHE_STATUS.PENDING,
    payload: { url: `${TEST_TRANSLATIONS_BASE_URL}en/common_${TEST_TRANSLATIONS_TIME_STAMP}.json` },
  },
  {
    type: CACHE_STATUS.DONE,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}en/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}en/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
  {
    type: CACHE_STATUS.DONE,
    payload: {
      url: `${TEST_TRANSLATIONS_BASE_URL}en/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}en/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  },
];

const expectedExternalTranslationInitActions = [
  ...expectedExternalFrTranslationsFetchActions,
  ...expectedExternalEnTranslationsFetchActions,
  ...expectedExternalTranslationInitSessionActions,
];

const expectedLanguageChangeActions = [
  {
    type: 'UPDATE_APP_SETTINGS',
    payload: { localisation: { activeLngCode: 'fr' } },
  },
  {
    type: 'UPDATE_SESSION',
    payload: { fallbackLanguageVersion: TEST_TRANSLATIONS_TIME_STAMP },
  },
  {
    type: 'UPDATE_SESSION',
    payload: { sessionLanguageCode: 'fr', sessionLanguageVersion: TEST_TRANSLATIONS_TIME_STAMP },
  },
];

const cachedFrTranslations = {
  [`${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`]:
    {
      status: CACHE_STATUS.DONE,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  [`${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`]:
    {
      status: CACHE_STATUS.DONE,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
};

const cachedEnTranslations = {
  [`${TEST_TRANSLATIONS_BASE_URL}en/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`]:
    {
      status: CACHE_STATUS.DONE,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
  [`${TEST_TRANSLATIONS_BASE_URL}en/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`]:
    {
      status: CACHE_STATUS.DONE,
      localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
    },
};

const mockedFirebaseConfigGetUrlAndTimeStampString = (key) => {
  switch (key) {
    case REMOTE_CONFIG.APP_LOCALES_LATEST_TIMESTAMP:
      return TEST_TRANSLATIONS_TIME_STAMP;

    case REMOTE_CONFIG.APP_LOCALES_URL:
      return TEST_TRANSLATIONS_BASE_URL;

    default:
      return null;
  }
};

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);
describe('Localisation actions', () => {
  beforeEach(() => {
    firebaseRemoteConfig.getString = () => '';
  });

  afterEach(() => {
    i18n.init();
  });

  describe('Picking language to use', () => {
    beforeEach(() => {
      RNLocalize.getLocales = jest.fn(() => ([
        {
          countryCode: 'FR',
          languageTag: 'fr-FR',
          languageCode: 'fr',
          isRTL: false,
        },
      ]));
    });

    it('should pick users\' preferred language if it\'s supported and no language is provided', async () => {
      localeConfig.supportedLanguages = { fr: 'Française' };

      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: '' } } },
        session: { data: { sessionLanguageCode: '' } },
      });

      const expectedAction = [
        {
          type: UPDATE_SESSION,
          payload: { sessionLanguageCode: 'fr', sessionLanguageVersion: 'LOCAL' },
        },
      ];

      await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
      const actualActions = store.getActions();

      expect(actualActions).toEqual(expect.arrayContaining(expectedAction));
    });

    it('should pick default language if user\'s preferred language is not supported', async () => {
      localeConfig.supportedLanguages = { en: 'English' };

      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: '' } } },
        session: { data: { sessionLanguageCode: '' } },
      });

      const userPreferredAction = [
        {
          type: UPDATE_SESSION,
          payload: { sessionLanguageCode: 'fr', sessionLanguageVersion: 'LOCAL' },
        },
      ];
      const expectedAction = [
        {
          type: UPDATE_SESSION,
          payload: { sessionLanguageCode: 'en', sessionLanguageVersion: 'LOCAL' },
        },
      ];

      await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
      const actualActions = store.getActions();

      expect(actualActions).toEqual(expect.arrayContaining(expectedAction));
      expect(actualActions).toEqual(expect.not.arrayContaining(userPreferredAction));
    });

    it('should pick default language if user\'s previously selected language is no longer supported', async () => {
      localeConfig.supportedLanguages = { en: 'English' };

      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: 'fr' } } },
        session: { data: { sessionLanguageCode: '' } },
      });

      const userPreferredAction = [
        {
          type: UPDATE_SESSION,
          payload: { sessionLanguageCode: 'fr', sessionLanguageVersion: 'LOCAL' },
        },
      ];
      const expectedAction = [
        {
          type: UPDATE_SESSION,
          payload: { sessionLanguageCode: 'en', sessionLanguageVersion: 'LOCAL' },
        },
        {
          type: UPDATE_APP_SETTINGS,
          payload: {
            localisation: { activeLngCode: 'en' },
          },
        }];

      await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
      const actualActions = store.getActions();

      expect(actualActions).toEqual(expect.arrayContaining(expectedAction));
      expect(actualActions).toEqual(expect.not.arrayContaining(userPreferredAction));
    });
  });

  describe('Fallback language', () => {
    beforeEach(() => {
      localeConfig.supportedLanguages = { en: 'English', fr: 'Française' };
      localeConfig.localTranslations = {
        en: { common: { test: EN_LOCAL_TEST_TRANSLATION, onlyLocal: ONLY_LOCAL_TRANSLATION }, auth: {} },
        fr: { common: {}, auth: {} },
      };

      i18n.init({
        ns: localeConfig.namespaces,
        defaultNS: localeConfig.defaultNameSpace,
        fallbackLng: localeConfig.defaultLanguage,
        supportedLngs: Object.keys(localeConfig.supportedLanguages),
        lng: localeConfig.defaultLanguage,
        resources: {
          [localeConfig.defaultLanguage]: {},
        },
      }, () => {});

      firebaseRemoteConfig.getString = mockedFirebaseConfigGetUrlAndTimeStampString;
    });

    it('should use local default language translation value if translation key is not available in ' +
      'default language external translations', async () => {
      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: 'en' } } },
        session: { data: { sessionLanguageCode: '', isOnline: true } },
        cache: { cachedUrls: {} },
      });
      await store.dispatch(getAndSetFallbackLanguageResources());
      expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
      expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
      expect(i18n.t('test')).toEqual(EN_EXTERNAL_TEST_TRANSLATION);
      expect(i18n.t('onlyLocal')).toEqual(ONLY_LOCAL_TRANSLATION);
    });

    it('should use local default language translation value' +
      'if translation key is not available nor in selected language, nor in default language external translations',
    async () => {
      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: 'fr' } } },
        session: { data: { sessionLanguageCode: '', isOnline: true } },
        cache: { cachedUrls: {} },
      });
      await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
      expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
      expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
      expect(i18n.hasResourceBundle('fr', 'auth')).toBeTruthy();
      expect(i18n.hasResourceBundle('fr', 'common')).toBeTruthy();
      expect(i18n.t('test')).toEqual(FR_EXTERNAL_TEST_TRANSLATION);
      expect(i18n.t('onlyLocal')).toEqual(ONLY_LOCAL_TRANSLATION);
    });
  });

  describe('Set language on App open', () => {
    beforeEach(() => {
      RNLocalize.getLocales = jest.fn(() => ([
        {
          countryCode: 'FR',
          languageTag: 'fr-FR',
          languageCode: 'fr',
          isRTL: false,
        },
      ]));
      localeConfig.localTranslations = {
        en: { common: { test: EN_LOCAL_TEST_TRANSLATION }, auth: {} },
        fr: { common: { test: FR_LOCAL_TEST_TRANSLATION }, auth: {} },
      };
      i18n.init({
        ns: localeConfig.namespaces,
        defaultNS: localeConfig.defaultNameSpace,
        fallbackLng: localeConfig.defaultLanguage,
        supportedLngs: Object.keys(localeConfig.supportedLanguages),
        lng: localeConfig.defaultLanguage,
        resources: {
          [localeConfig.defaultLanguage]: {},
        },
      }, () => {});
    });

    it('should use local EN as default language\'s translations if translations are not enabled', async () => {
      localeConfig.isEnabled = false;
      localeConfig.supportedLanguages = { en: 'English' };
      firebaseRemoteConfig.getString = () => '';
      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: '' } } },
      });
      const expectedActions = [];
      await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
      expect(i18n.language).toEqual('en');
      expect(i18n.t('test')).toEqual(EN_LOCAL_TEST_TRANSLATION);
    });

    describe('Initialising translations', () => {
      beforeEach(() => {
        localeConfig.supportedLanguages = {
          en: 'English',
          fr: 'Française',
          [LNG_LOCAL_ONLY]: 'Lietuvių',
        };
        localeConfig.localTranslations = {
          en: { common: { test: EN_LOCAL_TEST_TRANSLATION }, auth: {} },
          fr: { common: { test: FR_LOCAL_TEST_TRANSLATION, localOnly: FR_ONLY_LOCAL_TEST_TRANSLATION }, auth: {} },
          [LNG_LOCAL_ONLY]: { common: { test: LT_LOCAL_TEST_TRANSLATION }, auth: {} },
        };
        i18n.init({
          ns: localeConfig.namespaces,
          defaultNS: localeConfig.defaultNameSpace,
          fallbackLng: localeConfig.defaultLanguage,
          supportedLngs: Object.keys(localeConfig.supportedLanguages),
          lng: localeConfig.defaultLanguage,
          resources: {
            [localeConfig.defaultLanguage]: {},
          },
        }, () => {});
      });
      it('should initialise translations using local translations if connection is not available', async () => {
        const store = mockStore({
          appSettings: { data: { localisation: { activeLngCode: 'fr' } } },
          session: { data: { sessionLanguageCode: '', isOnline: false } },
        });
        localeConfig.isEnabled = true;
        await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedLocalTranslationInitActions);
        expect(i18n.language).toEqual('fr');
        expect(i18n.t('test')).toEqual(FR_LOCAL_TEST_TRANSLATION);
      });

      it('should initialise translations using external translations if baseUrl is available', async () => {
        const store = mockStore({
          appSettings: { data: { localisation: { activeLngCode: 'fr' } } },
          session: { data: { sessionLanguageCode: '', isOnline: true } },
          cache: { cachedUrls: {} },
        });

        firebaseRemoteConfig.getString = mockedFirebaseConfigGetUrlAndTimeStampString;

        await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedExternalTranslationInitActions);
        expect(i18n.language).toEqual('fr');
        expect(i18n.hasResourceBundle('fr', 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle('fr', 'common')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
        expect(i18n.t('test')).toEqual(FR_EXTERNAL_TEST_TRANSLATION);
        expect(i18n.t('localOnly')).toEqual(FR_ONLY_LOCAL_TEST_TRANSLATION);
      });

      it('should initialise translations using external translations if baseUrl is available ' +
        'but should not fetch translations if current version is already cached', async () => {
        const store = mockStore({
          appSettings: { data: { localisation: { activeLngCode: 'fr' } } },
          session: { data: { sessionLanguageCode: '', isOnline: true } },
          cache: {
            cachedUrls: {
              ...cachedFrTranslations,
              ...cachedEnTranslations,
            },
          },
        });

        firebaseRemoteConfig.getString = mockedFirebaseConfigGetUrlAndTimeStampString;

        await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedExternalTranslationInitSessionActions);
        expect(i18n.language).toEqual('fr');
        expect(i18n.hasResourceBundle('fr', 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle('fr', 'common')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
        expect(i18n.t('test')).toEqual(FR_EXTERNAL_TEST_TRANSLATION);
      });

      it('should initialise translations using external translations if baseUrl is available ' +
        'and refetch translations if at least one ns\' translations of that language is missing', async () => {
        const store = mockStore({
          appSettings: { data: { localisation: { activeLngCode: 'fr' } } },
          session: { data: { sessionLanguageCode: '', isOnline: true } },
          cache: {
            cachedUrls: {
              [`${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`]:
                {
                  status: CACHE_STATUS.DONE,
                  localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
                },
              ...cachedEnTranslations,
            },
          },
        });

        firebaseRemoteConfig.getString = mockedFirebaseConfigGetUrlAndTimeStampString;

        await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
        const actualActions = store.getActions();
        expect(actualActions).toEqual([
          {
            type: CACHE_STATUS.PENDING,
            payload: { url: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json` },
          },
          {
            type: CACHE_STATUS.DONE,
            payload: {
              url: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
              localPath: `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`,
            },
          },
          ...expectedExternalTranslationInitSessionActions,
        ]);
        expect(i18n.language).toEqual('fr');
        expect(i18n.hasResourceBundle('fr', 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle('fr', 'common')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
        expect(i18n.t('test')).toEqual(FR_EXTERNAL_TEST_TRANSLATION);
      });

      it('should initialise translations using local translations if baseUrl is available ' +
        'but external translations are missing', async () => {
        const store = mockStore({
          appSettings: { data: { localisation: { activeLngCode: LNG_LOCAL_ONLY } } },
          session: { data: { sessionLanguageCode: '', isOnline: true } },
          cache: { cachedUrls: {} },
        });

        firebaseRemoteConfig.getString = mockedFirebaseConfigGetUrlAndTimeStampString;

        await store.dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());
        const actualActions = store.getActions();
        expect(actualActions).toEqual([
          ...expectedExternalLtTranslationsFetchFailActions,
          ...expectedExternalEnTranslationsFetchActions,
          {
            type: UPDATE_SESSION,
            payload: { fallbackLanguageVersion: TEST_TRANSLATIONS_TIME_STAMP },
          },
          {
            type: UPDATE_SESSION,
            payload: { translationsInitialised: true },
          },
          {
            type: UPDATE_SESSION,
            payload: { sessionLanguageCode: LNG_LOCAL_ONLY, sessionLanguageVersion: 'LOCAL' },
          },
        ]);
        expect(i18n.language).toEqual(LNG_LOCAL_ONLY);
        expect(i18n.hasResourceBundle(LNG_LOCAL_ONLY, 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle(LNG_LOCAL_ONLY, 'common')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
        expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
        expect(i18n.t('test')).toEqual(LT_LOCAL_TEST_TRANSLATION);
      });
    });
  });

  describe('Change language', () => {
    beforeEach(() => {
      localeConfig.supportedLanguages = {
        en: 'English', fr: 'Française',
      };
      localeConfig.localTranslations = {
        en: { common: { test: EN_LOCAL_TEST_TRANSLATION }, auth: { test: EN_LOCAL_TEST_TRANSLATION } },
        fr: { common: { test: FR_LOCAL_TEST_TRANSLATION }, auth: {} },
      };
      i18n.init({
        ns: localeConfig.namespaces,
        defaultNS: localeConfig.defaultNameSpace,
        fallbackLng: localeConfig.defaultLanguage,
        supportedLngs: Object.keys(localeConfig.supportedLanguages),
        lng: localeConfig.defaultLanguage,
        resources: {
          [localeConfig.defaultLanguage]: {},
        },
      }, () => {});
      firebaseRemoteConfig.getString = mockedFirebaseConfigGetUrlAndTimeStampString;
    });

    it('should change language in settings and in i18next if it\'s supported', async () => {
      localeConfig.isEnabled = true;

      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: 'en' } } },
        session: { data: {} },
        cache: { cachedUrls: {} },
      });

      await store.dispatch(changeLanguageAction('fr'));
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedLanguageChangeActions);
      expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
      expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
      expect(i18n.hasResourceBundle('fr', 'auth')).toBeTruthy();
      expect(i18n.hasResourceBundle('fr', 'common')).toBeTruthy();
      expect(i18n.language).toEqual('fr');
      expect(i18n.t('test')).toEqual(FR_EXTERNAL_TEST_TRANSLATION);
      expect(i18n.t('englishOnly')).toEqual(EN_EXTERNAL_TEST_TRANSLATION);
    });

    it('should update fallback language on language change if it\'s LOCAL and baseUrl is provided', async () => {
      localeConfig.isEnabled = true;
      localeConfig.supportedLanguages = {
        en: 'English', fr: 'Française',
      };
      localeConfig.localTranslations = {
        en:
          {
            common: { test: EN_LOCAL_TEST_TRANSLATION, englishOnly: EN_LOCAL_TEST_TRANSLATION },
            auth: { test: EN_LOCAL_TEST_TRANSLATION },
          },
        fr: { common: { test: FR_LOCAL_TEST_TRANSLATION }, auth: {} },
      };
      firebaseRemoteConfig.getString = mockedFirebaseConfigGetUrlAndTimeStampString;
      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: 'en' } } },
        session: { data: { fallbackLanguageVersion: 'LOCAL' } },
        cache: { cachedUrls: {} },
      });

      await store.dispatch(changeLanguageAction('fr'));
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedLanguageChangeActions);
      expect(i18n.hasResourceBundle('en', 'auth')).toBeTruthy();
      expect(i18n.hasResourceBundle('en', 'common')).toBeTruthy();
      expect(i18n.hasResourceBundle('fr', 'auth')).toBeTruthy();
      expect(i18n.hasResourceBundle('fr', 'common')).toBeTruthy();
      expect(i18n.t('test')).toEqual(FR_EXTERNAL_TEST_TRANSLATION);
      expect(i18n.t('englishOnly')).toEqual(EN_EXTERNAL_TEST_TRANSLATION);
    });

    it('should not execute if translations are not enabled', async () => {
      localeConfig.isEnabled = false;
      const expectedActions = [];
      const store = mockStore({
        session: { data: {} },
      });

      await store.dispatch(changeLanguageAction('fr'));
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });

    it('should not change language if it\'s not supported', async () => {
      localeConfig.isEnabled = true;
      localeConfig.supportedLanguages = { en: 'English' };
      const store = mockStore({
        appSettings: { data: { localisation: { activeLngCode: 'en' } } },
        session: { data: {} },
      });

      const expectedActions = [];
      await store.dispatch(changeLanguageAction('fr'));
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });
  });
});
