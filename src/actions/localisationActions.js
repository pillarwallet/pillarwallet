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

import {
  setSessionTranslationBundleInitialisedAction,
  setFallbackLanguageVersionAction,
  setSessionLanguageAction,
} from 'actions/sessionActions';
import { setAppLanguageAction } from 'actions/appSettingsActions';

import Toast from 'components/Toast';

import type { TranslationResourcesOfLanguage } from 'models/Translations';
import type { Dispatch, GetState } from 'reducers/rootReducer';

import { logBreadcrumb } from 'utils/common';

const LOCAL = 'LOCAL';
const LANGUAGE_ERROR = {
  MISSES_NAMESPACES: 'Fallback language misses namespaces',
  NO_TRANSLATIONS: 'Fallback languages has no resources',
};

type SetLngAndBundle = {
  language: string,
  resources: TranslationResourcesOfLanguage,
  onSuccess?: () => void,
};

type GetTranslationResourcesProps = {
  language: string,
  dispatch: Dispatch,
  getState: GetState,
  getLocal?: boolean,
};

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
  const { language } = props;
  return { resources: getLocalTranslations(language), version: LOCAL };
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
      .then(() => {
        if (onSuccess) onSuccess();
      })
      .catch(() => {
        onLanguageChangeError();
      });
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
    const missingNameSpaces = localeConfig.namespaces.filter((ns) => !Object.keys(resources).includes(ns));

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
      appSettings: {
        data: { localisation },
      },
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

      const { resources, version } = await getTranslationsResources({ language, dispatch, getState });

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
      session: {
        data: { fallbackLanguageVersion },
      },
    } = getState();

    if (!localeConfig.isEnabled) return;

    if (isLanguageSupported(language)) {
      const { resources, version } = await getTranslationsResources({ language, dispatch, getState });
      const onLanguageChangeSuccess = () => {
        dispatch(setAppLanguageAction(language));

        Toast.show({
          message: t('toast.languageChanged'),
          emoji: 'ok_hand',
          autoClose: true,
        });
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
