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

import type { Theme } from 'models/Theme';
import { getThemeType } from './themes';


const patternPlaceholderLight = require('assets/images/no_logo.png');
const patternPlaceholderDark = require('assets/images/no_logo_dark.png');
const genericTokenLight = require('assets/images/tokens/genericTokenLight.png');
const genericTokenDark = require('assets/images/tokens/genericTokenDark.png');

function getImageByTheme(currentTheme, values) {
  return values[currentTheme];
}

export const images = (theme: Theme) => {
  const currentTheme = getThemeType(theme);
  return {
    patternPlaceholder: getImageByTheme(currentTheme, {
      lightTheme: patternPlaceholderLight,
      darkTheme: patternPlaceholderDark,
    }),
    genericToken: getImageByTheme(currentTheme, {
      lightTheme: genericTokenLight,
      darkTheme: genericTokenDark,
    }),
  };
};
