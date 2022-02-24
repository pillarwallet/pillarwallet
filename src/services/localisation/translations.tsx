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

import i18n from 'i18next';
import * as RNLocalize from 'react-native-localize';
import { initReactI18next } from 'react-i18next';

import localeConfig from 'configs/localeConfig';

import type { TranslationResourcesOfLanguage } from 'models/Translations';

import { PunctuationPostProcessor, CapitalizationPostProcessor, SuffixPrefixPostProcessor } from './postProcessors';

/* eslint-disable i18next/no-literal-string */
i18n
  .use(initReactI18next)
  .use(PunctuationPostProcessor)
  .use(SuffixPrefixPostProcessor)
  .use(CapitalizationPostProcessor)
  .init(
    {
      interpolation: { escapeValue: false },
      ns: localeConfig.namespaces,
      defaultNS: localeConfig.defaultNameSpace,
      postProcess: localeConfig.postProcessors,
      fallbackLng: localeConfig.defaultLanguage,
      supportedLngs: Object.keys(localeConfig.supportedLanguages),
      debug: !!__DEV__,
      react: {
        wait: true,
        nsMode: 'default',
        useSuspense: true,
      },
      lng: localeConfig.defaultLanguage,
      resources: {
        [localeConfig.defaultLanguage]: {},
      },
    },
    () => {},
  );
/* eslint-enable i18next/no-literal-string */

/**
 * Adds complete bundle.
 * Deep set as true will extend existing translations in that file.
 * Overwrite as true will overwrite existing translations in that file.
 */
export const addResourceBundles = (lng: string, nameSpaces: string[], translations: TranslationResourcesOfLanguage) => {
  nameSpaces.forEach((ns) => {
    if (translations[ns]) {
      i18n.addResourceBundle(lng, ns, translations[ns], true, false);
    }
  });
  i18n.reloadResources();
};

export const setLanguage = async (lng: string) => {
  i18n
    .changeLanguage(lng)
    .then(() => Promise.resolve())
    .catch(() => Promise.reject());
};

export const getDefaultSupportedUserLanguage = () => {
  const userPreferredLocales = RNLocalize.getLocales();
  const userPreferredLanguages = userPreferredLocales.map(({ languageCode }) => languageCode);

  const userPreferredSupportedLanguage = userPreferredLanguages.find((languageCode) =>
    Object.keys(localeConfig.supportedLanguages).includes(languageCode),
  );

  return userPreferredSupportedLanguage || localeConfig.defaultLanguage;
};

export const isLanguageSupported = (language: string) => {
  return Object.keys(localeConfig.supportedLanguages).includes(language);
};

export const getLanguageFullName = (languageCode: string) => {
  return localeConfig.supportedLanguages?.[languageCode];
};

export default i18n;
