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

import lightThemeColors from 'utils/themes/lightTheme';
import darkThemeColors from 'utils/themes/darkTheme';


export type ThemeColors = {
  [colorName: string]: string,
};

export type Theme = {
  current: string,
  colors: any,
};

type LightThemeColorKey = $Keys<typeof lightThemeColors>;
type DarkThemeColorKey = $Keys<typeof darkThemeColors>;

export type ColorKey = LightThemeColorKey | DarkThemeColorKey;

export type ColorsByThemeProps = {|
  lightKey?: LightThemeColorKey,
  darkKey?: DarkThemeColorKey,
  lightCustom?: string,
  darkCustom?: string,
|}
