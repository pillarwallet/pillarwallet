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

import isEmpty from 'lodash.isempty';

import localeConfig from 'configs/localeConfig';
import t from 'translations/translate';

import {
  addResourceBundles,
  getDefaultSupportedUserLanguage,
  setLanguage,
  isLanguageSupported,
} from 'services/localisation/translations';

import { cacheUrlAction, removeUrlCacheAction } from 'actions/cacheActions';
import {
  setSessionTranslationBundleInitialisedAction,
  setFallbackLanguageVersionAction,
  setSessionLanguageAction,
} from 'actions/sessionActions';
import { setAppLanguageAction } from 'actions/appSettingsActions';

import Toast from 'components/Toast';

import type { TranslationData, TranslationResourcesOfLanguage } from 'models/Translations';
import type { CachedUrls } from 'reducers/cacheReducer';
import type { Dispatch, GetState } from 'reducers/rootReducer';

import { reportErrorLog, reportLog } from 'utils/common';
import { getCachedJSONFile } from 'utils/cache';


const LOCAL = 'LOCAL';
const LANGUAGE_ERROR = {
  MISSES_NAMESPACES: 'Fallback language misses namespaces',
  NO_TRANSLATIONS: 'Fallback languages has no resources',
};

type SetLngAndBundle = {
  language: string,
  resources: TranslationResourcesOfLanguage,
  onSuccess?: () => void,
}

const getTranslationData = (lng: string) => localeConfig.namespaces.map((ns) => ({
  ns,
  url: `${localeConfig.baseUrl}${lng}/${ns}.json`, // eslint-disable-line i18next/no-literal-string
}));

const getCachedTranslationResources =
  async (translationsData: TranslationData[], cachedUrls: CachedUrls, dispatch: Dispatch) => {
    const cachedTranslations = await Promise.all(translationsData.map(async ({ ns, url }) => {
      const { localPath } = cachedUrls?.[url] || {};
      if (!localPath) return { ns, translations: {} };

      const translations = await getCachedJSONFile(localPath);

      if (!translations) {
        // cached file no longer exists - remove it from map
        dispatch(removeUrlCacheAction(url));
        return { ns, translations: {} };
      }
      return { ns, translations };
    })).catch((e) => {
      reportLog(LANGUAGE_ERROR.NO_TRANSLATIONS, e);
      return [];
    });

    return cachedTranslations.reduce((formattedResources, translation) => {
      const { ns, translations } = translation;
      if (ns && translations) formattedResources[ns] = translations;
      return formattedResources;
    }, {});
  };

const getTranslationsResources = async (props) => {
  const {
    language,
    dispatch,
    getState,
  } = props;
  let resources;
  // TODO: pass in versioning;
  let version = '';
  const missingNsArray = [];
  const translationsData = getTranslationData(language);

  const { session: { data: { isOnline } } } = getState();

  const relatedLocalTranslationData = localeConfig.localTranslations[language] || {};

  // if translations' baseUrl is provided - use external translations. If not - local.
  if (localeConfig.baseUrl) {
    // If network is available - fetch and cache newest translations
    // TODO: fetch newest only once per session.
    if (isOnline) {
      // fetches to storage and set local path to cachedUrls
      await Promise.all(translationsData.map(({ url }) => dispatch(cacheUrlAction(url))));
    }

    // get newest cached translations
    const { cache: { cachedUrls } } = getState();
    resources = await getCachedTranslationResources(translationsData, cachedUrls, dispatch);

    // check missing namespaces
    const existingNameSpaces = Object.keys(resources).filter(ns => !isEmpty(resources[ns]));
    const missingNameSpaces = localeConfig.namespaces.filter(ns => !existingNameSpaces.includes(ns));
    if (missingNameSpaces.length) {
      // found missing name spaces - add locally stored ones (if any)
      // const relatedLocalTranslationData = localeConfig.localTranslations[language];
      if (relatedLocalTranslationData) {
        version = LOCAL;
        const missingTranslationResources = missingNameSpaces.reduce((allResources, ns) => {
          const relatedTranslations = relatedLocalTranslationData[ns];
          if (relatedTranslations) {
            allResources[ns] = relatedTranslations;
          } else {
            missingNsArray.push(ns);
          }
          return allResources;
        }, {});
        resources = { ...resources, ...missingTranslationResources };
      }
    }
  } else {
    resources = localeConfig.namespaces.reduce((mappedResources, ns) => {
      const localTranslations = relatedLocalTranslationData[ns];
      if (localTranslations) {
        mappedResources[ns] = localTranslations;
      }
      return mappedResources;
    }, {});
    version = LOCAL;
  }

  return { resources, missingNsArray, version };
};

const onLanguageChangeError = () => {
  Toast.show({
    message: t('toast.languageChangeFailed'),
    emoji: 'hushed',
    supportLink: true,
  });
};

const setLanguageAndTranslationBundles = async ({ language, resources, onSuccess }: SetLngAndBundle) => {
  const resourceTranslations = Object.values(resources).filter((translations) => !isEmpty(translations));
  const hasSomeTranslations = !!resourceTranslations.length;
  if (hasSomeTranslations) {
    await addResourceBundles(language, localeConfig.namespaces, resources);
    setLanguage(language)
      .then(() => { if (onSuccess) onSuccess(); })
      .catch(() => { onLanguageChangeError(); });
  } else {
    // report to sentry if fallback language misses translations
    if (language === localeConfig.defaultLanguage) {
      reportErrorLog(LANGUAGE_ERROR.NO_TRANSLATIONS);
    }
    onLanguageChangeError();
  }
};

export const getAndSetFallbackLanguageResources = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const language = localeConfig.defaultLanguage;
    const { resources, version } = await getTranslationsResources({ language, dispatch, getState });

    const fallbackTranslations = Object.values(resources).filter((translations) => !isEmpty(translations));
    const hasFallbackTranslations = !!fallbackTranslations.length;

    const missingNameSpaces = localeConfig.namespaces.filter(ns => !Object.keys(resources).includes(ns));

    if (missingNameSpaces.length || !hasFallbackTranslations) {
      const ERROR = missingNameSpaces.length ? LANGUAGE_ERROR.MISSES_NAMESPACES : LANGUAGE_ERROR.NO_TRANSLATIONS;
      const extra = missingNameSpaces.length ? { missingNameSpaces } : null;
      reportLog(ERROR, extra);
    }

    if (hasFallbackTranslations) {
      await addResourceBundles(language, localeConfig.namespaces, resources);
      dispatch(setFallbackLanguageVersionAction(version));
    } else {
      dispatch(setFallbackLanguageVersionAction(LOCAL));
    }
  };
};

export const getTranslationsResourcesAndSetLanguageOnAppOpen = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { localisation } },
    } = getState();

    // might be first open, hence - no localisation info is present;
    const { activeLngCode } = localisation || {};
    let language = activeLngCode || getDefaultSupportedUserLanguage();

    // check if translations are supported. If not - use local default lang translations
    if (!localeConfig.isEnabled) {
      const localDefaultTranslations = localeConfig.localTranslations[localeConfig.defaultLanguage];
      const localDefaultTranslationResources = localeConfig.namespaces.reduce((allResources, ns) => {
        const relatedTranslations = localDefaultTranslations[ns];
        if (relatedTranslations) allResources[ns] = relatedTranslations;
        return allResources;
      }, {});

      await setLanguageAndTranslationBundles({
        resources: localDefaultTranslationResources,
        language: localeConfig.defaultLanguage,
      });
    } else {
      if (!!activeLngCode && !isLanguageSupported(activeLngCode)) {
        // previously selected language is no longer supported - fallback to default supported device language;
        language = getDefaultSupportedUserLanguage();
        if (!Object.keys(localeConfig.supportedLanguages).includes(activeLngCode)) {
          Toast.show({
            message: t('toast.languageIsNoLongerSupported'),
            emoji: 'hushed',
            autoClose: true,
          });
        }
      }

      const {
        resources,
        version,
        missingNsArray,
      } = await getTranslationsResources({ language, dispatch, getState });

      // log to Sentry if any default language name spaces are missing
      if (language === localeConfig.defaultLanguage && missingNsArray.length) {
        reportErrorLog(LANGUAGE_ERROR.MISSES_NAMESPACES, { missingNameSpaces: missingNsArray });
      }

      await setLanguageAndTranslationBundles({ resources, language });

      // get fallback language translations if selected language is not fallback
      if (language !== localeConfig.defaultLanguage) {
        await dispatch(getAndSetFallbackLanguageResources());
      } else {
        // if is changing to fallback language - update fallbackLanguageVersion
        dispatch(setFallbackLanguageVersionAction(version));
      }

      dispatch(setSessionTranslationBundleInitialisedAction());
      dispatch(setSessionLanguageAction(language));
    }
  };
};

export const changeLanguageAction = (language: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: { fallbackLanguageVersion } },
    } = getState();

    if (!localeConfig.isEnabled) return;

    if (isLanguageSupported(language)) {
      const { resources, missingNsArray, version } = await getTranslationsResources({ language, dispatch, getState });
      const onLanguageChangeSuccess = () => {
        dispatch(setAppLanguageAction(language, version));
        if (missingNsArray?.length) {
          Toast.show({
            message: t('toast.languageChangedWithSomeTranslationsMissing'),
            emoji: 'hushed',
            autoClose: true,
          });
          if (language === localeConfig.defaultLanguage) {
            reportErrorLog(LANGUAGE_ERROR.MISSES_NAMESPACES, { missingNameSpaces: missingNsArray });
          }
        } else {
          Toast.show({
            message: t('toast.languageChanged'),
            emoji: 'ok_hand',
            autoClose: true,
          });
        }
      };

      await setLanguageAndTranslationBundles({ resources, language, onSuccess: onLanguageChangeSuccess });

      // if is changing to fallback language - update fallbackLanguageVersion
      if (language === localeConfig.defaultLanguage) {
        dispatch(setFallbackLanguageVersionAction(version));
      } else if (!fallbackLanguageVersion || fallbackLanguageVersion === LOCAL) {
        // fallback language is needed to be updated on language change
        await getAndSetFallbackLanguageResources();
      }
      dispatch(setSessionLanguageAction(language));
    } else {
      Toast.show({
        message: t('toast.languageIsNotSupported'),
        emoji: 'hushed',
        autoClose: true,
      });
    }
  };
};

export const updateTranslationResourceOnNetworkChangeAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { localisation } },
      session: { data: { isOnline, fallbackLanguageVersion, translationsInitialised } },
    } = getState();

    if (!translationsInitialised || !localeConfig.isEnabled || !localeConfig.baseUrl) return;

    const { translationVersion, activeLngCode } = localisation || {};
    const language = activeLngCode || getDefaultSupportedUserLanguage();

    if (isOnline) {
      // update fallback language translations if using local
      if (fallbackLanguageVersion === LOCAL && language !== localeConfig.defaultLanguage) {
        await dispatch(getAndSetFallbackLanguageResources());
      }
      if (translationVersion === LOCAL && !!language) {
        // retry fetching translations to change local ones into newest possible
        const { resources, version } = await getTranslationsResources({ language, dispatch, getState });

        const onLanguageChangeSuccess = () => {
          dispatch(setAppLanguageAction(language, version));
        };

        await setLanguageAndTranslationBundles({ resources, language, onSuccess: onLanguageChangeSuccess });
      }
    }
  };
};
