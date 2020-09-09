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

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { TranslationResourcesOfLanguage } from 'models/Translations';

import languageDetector from './deviceLanguageDetector';
import { DEFAULT_NAMESPACE, NAMESPACES, POST_PROCESSORS, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './config';
import { PunctuationPostProcessor, CapitalizationPostProcessor, SuffixPrefixPostProcessor } from './postProcessors';

i18n
  .use(initReactI18next)
  .use(languageDetector)
  .use(PunctuationPostProcessor)
  .use(SuffixPrefixPostProcessor)
  .use(CapitalizationPostProcessor)
  .init({
    interpolation: { escapeValue: false },
    transSupportBasicHtmlNodes: false,
    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    postProcess: POST_PROCESSORS,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: __DEV__ ? [...SUPPORTED_LANGUAGES, 'fr'] : SUPPORTED_LANGUAGES,
    debug: !!__DEV__,
    react: {
      wait: true,
      bindI18n: 'languageChanged loaded added',
      bindStore: 'added removed',
      nsMode: 'common',
    },
  }, () => {},
  );

/**
 * Adds complete bundle.
 * Deep set as true will extend existing translations in that file.
 * Overwrite as true will overwrite existing translations in that file.
 */
export const addResourceBundles = (lng: string, nameSpaces: string[], translations: TranslationResourcesOfLanguage) => {
  nameSpaces.forEach((ns) => {
    if (translations[ns]) {
      i18n.addResourceBundle(lng, ns, translations[ns], true, true);
    }
  });
  i18n.reloadResources();
};


export const setLanguage = async (lng: string) => {
  return new Promise((resolve, reject) => {
    i18n.changeLanguage(lng)
      .then(() => resolve())
      .catch((e) => reject(e));
  });
};

export const getDefaultLanguage = () => {
  // todo: get lang from user device?
  return DEFAULT_LANGUAGE;
};

export default i18n;
