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

import type { Dispatch, GetState } from 'reducers/rootReducer';
import localeConfig from 'configs/localeConfig';
import t from 'translations/translate';

import { addResourceBundles, getDefaultLanguage, setLanguage } from 'translations/setup';
import { NAMESPACES } from 'translations/config';
import { getCachedJSONFile } from 'utils/cache';
import type { CacheMap } from 'reducers/cacheReducer';

import { cacheUrlAction } from 'actions/cacheActions';
import { setSessionTranslationBundleInitialisedAction } from 'actions/sessionActions';
import { setAppLanguageAction } from 'actions/appSettingsActions';

import Toast from 'components/Toast';
import type { TranslationData, TranslationResourcesOfLanguage } from 'models/Translations';

const LOCAL = 'LOCAL';

type SetLngAndBundle = {
  language: string,
  resources: TranslationResourcesOfLanguage,
  onSuccess?: () => void,
}

const getTranslationData = (lng: string) => {
  return NAMESPACES.map((ns) => ({ ns, url: `${localeConfig.baseUrl}${lng}/${ns}.json` }));
};

const getCachedTranslationResources = async (translationsData: TranslationData[], cacheMap: CacheMap) => {
  const cachedTranslations = await Promise.all(translationsData.map(async ({ ns, url }) => {
    const { localUrl } = cacheMap?.[url] || {};

    if (!localUrl) return { ns, translations: {} };

    const translations = await getCachedJSONFile(localUrl);
    return { ns, translations };
  }));

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
  // todo: pass in versioning;
  let version = '';
  const missingNsArray = [];
  const translationsData = getTranslationData(language);

  const { session: { data: { isOnline } } } = getState();

  // If network is available - fetch and cache newest translations
  // TODO: decide on how frequent to update translations - now its fetching newest all the time
  if (isOnline) {
    // fetches to storage and set local path to cacheMap
    await Promise.all(translationsData.map(({ url }) => dispatch(cacheUrlAction(url))));
  }

  // get newest cached translations
  const { cache: { cacheMap } } = getState();
  resources = await getCachedTranslationResources(translationsData, cacheMap);

  // check missing namespaces
  const existingNameSpaces = Object.keys(resources).filter(ns => !isEmpty(resources[ns]));
  const missingNameSpaces = NAMESPACES.filter(ns => !existingNameSpaces.includes(ns));

  if (missingNameSpaces.length) {
    // found missing name spaces - add locally stored ones (if any)
    const relatedLocalTranslationData = localeConfig.localTranslations[language];
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
    await addResourceBundles(language, NAMESPACES, resources);
    setLanguage(language)
      .then(() => { if (onSuccess) onSuccess(); })
      .catch(() => { onLanguageChangeError(); });
  } else {
    onLanguageChangeError();
  }
};

export const getTranslationsResourcesAndSetLanguageOnAppOpen = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { localisation } },
    } = getState();

    // might be first open, hence - no localisation info is present;
    const { activeLngCode } = localisation || {};
    const language = activeLngCode || getDefaultLanguage();
    const { resources } = await getTranslationsResources({ language, dispatch, getState });

    await setLanguageAndTranslationBundles({ resources, language });
    dispatch(setSessionTranslationBundleInitialisedAction());
  };
};

export const changeLanguageAction = (language: string, showToast?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const resourcesProps = { language, dispatch, getState };
    const { resources, missingNsArray, version } = await getTranslationsResources(resourcesProps);

    const onLanguageChangeSuccess = () => {
      dispatch(setAppLanguageAction(language, version));

      if (showToast) {
        if (missingNsArray?.length) {
          Toast.show({
            message: t('toast.languageChangedWithSomeTranslationsMissing'),
            emoji: 'hushed',
            autoClose: true,
          });
        } else {
          Toast.show({
            message: t('toast.languageChanged'),
            emoji: 'ok_hand',
            autoClose: true,
          });
        }
      }
    };

    await setLanguageAndTranslationBundles({ resources, language, onSuccess: onLanguageChangeSuccess });
  };
};
