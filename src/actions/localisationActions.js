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
import { firebaseRemoteConfig } from 'services/firebase';

import { cacheUrlAction, removeUrlCacheAction } from 'actions/cacheActions';
import {
  setSessionTranslationBundleInitialisedAction,
  setFallbackLanguageVersionAction,
  setSessionLanguageAction,
} from 'actions/sessionActions';
import { setAppLanguageAction } from 'actions/appSettingsActions';

import Toast from 'components/Toast';

import type { TranslationResourcesOfLanguage } from 'models/Translations';
import type { Dispatch, GetState } from 'reducers/rootReducer';

import { reportLog, logBreadcrumb } from 'utils/common';
import { getCachedTranslationResources } from 'utils/cache';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { CACHE_STATUS } from 'constants/cacheConstants';


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

const getTranslationData = (lng: string, baseUrl: string, version: string) => localeConfig.namespaces.map((ns) => {
  let url = '';
  if (baseUrl) {
    /* eslint-disable i18next/no-literal-string */
    if (version) {
      url = `${baseUrl}${lng}/${ns}_${version}.json`;
    } else {
      url = `${baseUrl}${lng}/${ns}.json`;
    }
    /* eslint-enable i18next/no-literal-string */
  }
  return {
    ns,
    url,
  };
});

type GetTranslationResourcesProps = {
  language: string,
  dispatch: Dispatch,
  getState: GetState,
  getLocal?: boolean,
}


const getLocalTranslations = (language: string) => {
  const relatedLocalTranslationData = localeConfig.localTranslations[language];
  if (!relatedLocalTranslationData) {
    logBreadcrumb('getLocalTranslations', 'Local translations are missing', { language });
    return {};
  }
  return localeConfig.namespaces.reduce((mappedResources, ns) => {
    const localTranslations = relatedLocalTranslationData[ns];
    if (localTranslations) {
      mappedResources[ns] = localTranslations;
    }
    return mappedResources;
  }, {});
};

const getTranslationsResources = async (props: GetTranslationResourcesProps) => {
  const { language, dispatch, getState } = props;
  let resources;
  let version = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_LOCALES_LATEST_TIMESTAMP);
  const baseUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_LOCALES_URL);

  const missingNsArray = [];
  const translationsData = getTranslationData(language, baseUrl, version);

  const { session: { data: { isOnline } } } = getState();

  const relatedLocalTranslationData = localeConfig.localTranslations[language] || {};

  // if translations' baseUrl is provided - use external translations. If not - local.
  if (baseUrl) {
    // If network is available and no cached version exists - fetch and cache newest translations
    const { cache: { cachedUrls: cachedUrlsBeforeFetching } } = getState();

    const translationsUrl = translationsData.map(({ url }) => url);
    const doneCachingUrls = Object.keys(cachedUrlsBeforeFetching)
      .filter((url) => cachedUrlsBeforeFetching[url]?.status === CACHE_STATUS.DONE);
    const hasFullyCachedVersion = translationsUrl.every(i => doneCachingUrls.includes(i));

    if (isOnline && !hasFullyCachedVersion) {
      // fetches to storage and set local path to cachedUrls
      await Promise.all(translationsData.map(({ url }) => dispatch(cacheUrlAction(url))));
    }

    // get newest cached translations
    const { cache: { cachedUrls } } = getState();
    resources = await getCachedTranslationResources(
      translationsData,
      cachedUrls,
      url => dispatch(removeUrlCacheAction(url)),
      e => reportLog(LANGUAGE_ERROR.NO_TRANSLATIONS, e),
    );

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
    resources = getLocalTranslations(language);
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
      logBreadcrumb('setLanguageAndTranslationBundles', LANGUAGE_ERROR.NO_TRANSLATIONS);
    }
    onLanguageChangeError();
  }
};

export const getAndSetFallbackLanguageResources = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const language = localeConfig.defaultLanguage;
    const localResources = getLocalTranslations(language);

    const { resources, version } = await getTranslationsResources({ language, dispatch, getState });

    const fallbackTranslations = Object.values(resources).filter((translations) => !isEmpty(translations));
    const hasFallbackTranslations = !!fallbackTranslations.length;
    const missingNameSpaces = localeConfig.namespaces.filter(ns => !Object.keys(resources).includes(ns));

    if (missingNameSpaces.length || !hasFallbackTranslations) {
      const ERROR = missingNameSpaces.length ? LANGUAGE_ERROR.MISSES_NAMESPACES : LANGUAGE_ERROR.NO_TRANSLATIONS;
      const extra = missingNameSpaces.length ? { missingNameSpaces } : null;
      logBreadcrumb('getTranslationsResources', ERROR, extra);
    }

    if (hasFallbackTranslations) {
      await addResourceBundles(language, localeConfig.namespaces, resources);
      await addResourceBundles(language, localeConfig.namespaces, localResources);
      dispatch(setFallbackLanguageVersionAction(version));
    } else {
      dispatch(setFallbackLanguageVersionAction(LOCAL));
    }
  };
};

export const getTranslationsResourcesAndSetLanguageOnAppOpenAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { localisation } },
    } = getState();

    // might be first open, hence - no localisation info is present;
    const { activeLngCode } = localisation || {};
    let language = activeLngCode || getDefaultSupportedUserLanguage();

    // check if translations are supported. If not - use local default lang translations
    if (!localeConfig.isEnabled) {
      const localDefaultTranslationResources = getLocalTranslations(localeConfig.defaultLanguage);
      await setLanguageAndTranslationBundles({
        resources: localDefaultTranslationResources,
        language: localeConfig.defaultLanguage,
      });
    } else {
      if (!!activeLngCode && !isLanguageSupported(activeLngCode)) {
        // previously selected language is no longer supported - fallback to default supported device language;
        language = getDefaultSupportedUserLanguage();
        Toast.show({
          message: t('toast.languageIsNoLongerSupported'),
          emoji: 'hushed',
          autoClose: true,
        });
        dispatch(setAppLanguageAction(language));
      }

      const {
        resources,
        version,
        missingNsArray,
      } = await getTranslationsResources({ language, dispatch, getState });

      // log to Sentry if any default language name spaces are missing
      if (language === localeConfig.defaultLanguage && missingNsArray.length) {
        logBreadcrumb('getTranslationsResourcesAndSetLanguageOnAppOpenAction', LANGUAGE_ERROR.MISSES_NAMESPACES, {
          missingNameSpaces: missingNsArray,
        });
      }

      await setLanguageAndTranslationBundles({ resources, language });

      // get fallback language translations if selected language is not fallback
      if (language !== localeConfig.defaultLanguage) {
        await dispatch(getAndSetFallbackLanguageResources());
      } else {
        // if is changing to fallback language - update fallbackLanguageVersion
        dispatch(setFallbackLanguageVersionAction(version));
      }

      const localResources = getLocalTranslations(language);
      await addResourceBundles(language, localeConfig.namespaces, localResources);

      dispatch(setSessionTranslationBundleInitialisedAction());
      dispatch(setSessionLanguageAction(language, version));
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
        dispatch(setAppLanguageAction(language));
        if (missingNsArray?.length) {
          Toast.show({
            message: t('toast.languageChangedWithSomeTranslationsMissing'),
            emoji: 'hushed',
            autoClose: true,
          });
          if (language === localeConfig.defaultLanguage) {
            logBreadcrumb('changeLanguageAction', LANGUAGE_ERROR.MISSES_NAMESPACES, {
              missingNameSpaces: missingNsArray,
            });
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
        await dispatch(getAndSetFallbackLanguageResources());
      }
      dispatch(setSessionLanguageAction(language, version));
    } else {
      Toast.show({
        message: t('toast.languageIsNotSupported'),
        emoji: 'hushed',
        autoClose: true,
      });
    }
  };
};

export const updateTranslationResourceOnContextChangeAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { isFetched, data: { localisation } },
      session: {
        data: {
          isOnline, fallbackLanguageVersion, translationsInitialised, sessionLanguageVersion,
        },
      },
    } = getState();

    if (!isFetched) return;

    const baseUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_LOCALES_URL);

    if (!translationsInitialised || !localeConfig.isEnabled || !baseUrl) return;

    const { activeLngCode } = localisation || {};
    const language = activeLngCode || getDefaultSupportedUserLanguage();

    if (isOnline) {
      // update fallback language translations if using local
      if (fallbackLanguageVersion === LOCAL && language !== localeConfig.defaultLanguage) {
        await dispatch(getAndSetFallbackLanguageResources());
      }
      if (sessionLanguageVersion === LOCAL && !!language) {
        // retry fetching translations to change local ones into newest possible
        const { resources, version } = await getTranslationsResources({ language, dispatch, getState });

        const onLanguageChangeSuccess = () => {
          dispatch(setAppLanguageAction(language));
          dispatch(setSessionLanguageAction(language, version));
        };

        await setLanguageAndTranslationBundles({ resources, language, onSuccess: onLanguageChangeSuccess });
      }
    }
  };
};
