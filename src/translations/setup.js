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
import languageDetector from './deviceLanguageDetector';
import translationLoader from './translationLoader';
import { DEFAULT_NAMESPACE, NAMESPACES, POST_PROCESSORS, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './config';
import { PunctuationPostProcessor, CapitalizationPostProcessor, SuffixPrefixPostProcessor } from './postProcessors';


i18n
  .use(initReactI18next)
  .use(languageDetector)
  .use(translationLoader)
  .use(PunctuationPostProcessor)
  .use(SuffixPrefixPostProcessor)
  .use(CapitalizationPostProcessor)
  .init({
    transSupportBasicHtmlNodes: false,
    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    postProcess: POST_PROCESSORS,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: __DEV__ ? [...SUPPORTED_LANGUAGES, 'fr'] : SUPPORTED_LANGUAGES,
    debug: !!__DEV__,
  });

export default i18n;
