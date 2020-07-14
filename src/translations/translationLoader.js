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

import type { TranslationResource } from 'models/Translations';

// en
const COMMON_EN = require('./locales/en/common.json');

// fr
const COMMON_FR = require('./locales/fr/common.json');


const sources = {
  en: {
    common: () => COMMON_EN,
  },
  fr: {
    common: () => COMMON_FR,
  },
};

const translationLoader = {
  type: 'backend',
  init: () => {},
  read: (language: string, namespace: string, callback: (error: ?Error, resource: ?TranslationResource) => void) => {
    let resource;
    let error;
    try {
      resource = sources[language][namespace]();
    } catch (_error) {
      error = _error;
    }
    callback(error, resource);
  },
};

export default translationLoader;
