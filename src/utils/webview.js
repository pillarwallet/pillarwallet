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

import { Platform } from 'react-native';
// eslint-disable-next-line import/no-extraneous-dependencies
import CookieManager from '@react-native-cookies/cookies';

export const clearWebViewCookies = () => {
  if (Platform.OS === 'ios') {
    CookieManager.clearAll(true)
      .then(() => {})
      .catch(() => null);
    CookieManager.clearAll(false)
      .then(() => {})
      .catch(() => null);
  } else {
    CookieManager.clearAll()
      .then(() => {})
      .catch(() => null);
  }
};
