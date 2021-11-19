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
/* eslint-disable i18next/no-literal-string */

import {
  CAPITALIZATION_POSTPROCESSOR,
  PUNCTUATION_POSTPROCESSOR,
  SUFFIX_PREFIX_POSTPROCESSOR,
} from 'constants/localesConstants';
import { devOptions } from './buildConfig';

// EN
const EN_COMMON = require('../locales/en/common.json');
const EN_AUTH = require('../locales/en/auth.json');

// AM
const AM_COMMON = require('../locales/am/common.json');
const AM_AUTH = require('../locales/am/auth.json');

// BS
const BS_COMMON = require('../locales/bs/common.json');
const BS_AUTH = require('../locales/bs/auth.json');

// SQ
const SQ_COMMON = require('../locales/sq/common.json');
const SQ_AUTH = require('../locales/sq/auth.json');

export const DEFAULT_LANGUAGE_CODE = 'en';
const DEFAULT_LANGUAGE = 'English';
const DEFAULT_NAMESPACE = 'common';

type SupportedLanguages = {
  [language: string]: string,
};
type PathsToLocalTranslation = {
  [language: string]: {
    common: Object,
    auth: Object,
  };
};
type LocalisationConfig = {
  isEnabled: boolean,
  defaultLanguage: string,
  supportedLanguages: SupportedLanguages,
  defaultNameSpace: string,
  namespaces: Array<string>,
  postProcessors: Array<string>,
  localTranslations: PathsToLocalTranslation,
};

export default ({
  isEnabled: !__DEV__ || !devOptions.DISABLE_EXTERNAL_TRANSLATIONS_ON_DEV, // to always keep enabled in production
  defaultLanguage: DEFAULT_LANGUAGE_CODE,
  // pairs of language code and language name in native language
  supportedLanguages: {
    [DEFAULT_LANGUAGE_CODE]: DEFAULT_LANGUAGE,
    am: 'አማርኛ',
    bs: 'Bosanski',
    sq: 'Shqip',
  },
  defaultNameSpace: DEFAULT_NAMESPACE,
  namespaces: ['auth', DEFAULT_NAMESPACE],
  postProcessors: [PUNCTUATION_POSTPROCESSOR, CAPITALIZATION_POSTPROCESSOR, SUFFIX_PREFIX_POSTPROCESSOR],
  localTranslations: {
    [DEFAULT_LANGUAGE_CODE]: {
      common: EN_COMMON,
      auth: EN_AUTH,
    },
    am: {
      common: AM_COMMON,
      auth: AM_AUTH,
    },
    bs: {
      common: BS_COMMON,
      auth: BS_AUTH,
    },
    sq: {
      common: SQ_COMMON,
      auth: SQ_AUTH,
    },
  },
}: LocalisationConfig);
