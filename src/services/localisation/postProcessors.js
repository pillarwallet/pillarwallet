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

import i18n from 'i18next';
import { capitalize } from 'utils/strings';
import type { TranslationOptions } from 'models/Translations';
import {
  CAPITALIZATION_POSTPROCESSOR,
  PUNCTUATION_POSTPROCESSOR,
  SUFFIX_PREFIX_POSTPROCESSOR,
} from 'constants/localesConstants';


export const PunctuationPostProcessor = {
  type: 'postProcessor',
  name: PUNCTUATION_POSTPROCESSOR,
  process: (value: string, key: string, options: TranslationOptions) => {
    if (options.exclamation || options.questionMark) {
      const exclamation = options.exclamation ? '!' : '';
      const questionMark = options.questionMark ? '?' : '';
      if (i18n.language === 'es') {
        const invertedExclamation = options.exclamation ? '¡' : '';
        const invertedQuestionMark = options.questionMark ? '¿' : '';
        return `${invertedExclamation}${invertedQuestionMark}${value}${exclamation}${questionMark}`;
      }
      return `${value}${exclamation}${questionMark}`;
    }
    return value;
  },
};

export const CapitalizationPostProcessor = {
  type: 'postProcessor',
  name: CAPITALIZATION_POSTPROCESSOR,
  process: (value: string, key: string, options: TranslationOptions) => {
    if (options.capitalize) {
      return capitalize(value);
    }
    return value;
  },
};

export const SuffixPrefixPostProcessor = {
  type: 'postProcessor',
  name: SUFFIX_PREFIX_POSTPROCESSOR,
  process: (value: string, key: string, options: TranslationOptions) => {
    if (options.suffix || options.prefix) {
      const { suffix = '', prefix = '' } = options;
      return `${prefix}${value}${suffix}`;
    }
    return value;
  },
};
