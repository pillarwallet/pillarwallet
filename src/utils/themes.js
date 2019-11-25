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
import theme from 'styled-theming';

export const lightThemeColors = {
  text: '#0A1427',
  accent: '#818EB3',
  primary: '#007AFF',
  secondaryAccent: '#EBF0F5',
  secondaryText: '#8B939E',
  border: '#EDEDED',
  positive: '#2AA057',
  negative: '#BD573A',
  surface: '#FAFAFA',
  card: '#FFFFFF',
  tertiary: '#EBF0F6',
  control: '#FCFDFF',
  warning: '#ECA93A',
  indicator: '#F8E71C', // NOT IN DS BUT CURRENTLY REQUIRED
  userAvatar: '#a9aeb8', // NOT IN DS BUT CURRENTLY REQUIRED
};

export const darkThemeColors = {
  text: '#B1BBD9',
  accent: '#818EB3',
  primary: '#007AFF',
  secondaryAccent: '#EBF0F5',
  secondaryText: '#8B939E',
  border: '#181F30',
  positive: '#00E097',
  negative: '#FF367F',
  surface: '#222C46',
  card: '#222C46',
  tertiary: '#171F31',
  control: '#FCFDFF',
  warning: 'blue', // TODO: add correct one when added to Design System
  indicator: 'blue', // TODO: add correct one when added to Design System
  userAvatar: 'blue', // TODO: add correct one when added to Design System
};

export const themedColors = {
  text: theme('mode', {
    lightMode: lightThemeColors.text,
    darkMode: darkThemeColors.text,
  }),
  accent: theme('mode', {
    lightMode: lightThemeColors.accent,
    darkMode: darkThemeColors.accent,
  }),
  primary: theme('mode', {
    lightMode: lightThemeColors.primary,
    darkMode: darkThemeColors.primary,
  }),
  secondaryAccent: theme('mode', {
    lightMode: lightThemeColors.secondaryAccent,
    darkMode: darkThemeColors.secondaryAccent,
  }),
  secondaryText: theme('mode', {
    lightMode: lightThemeColors.secondaryText,
    darkMode: darkThemeColors.secondaryText,
  }),
  border: theme('mode', {
    lightMode: lightThemeColors.border,
    darkMode: darkThemeColors.border,
  }),
  positive: theme('mode', {
    lightMode: lightThemeColors.positive,
    darkMode: darkThemeColors.positive,
  }),
  negative: theme('mode', {
    lightMode: lightThemeColors.negative,
    darkMode: darkThemeColors.negative,
  }),
  surface: theme('mode', {
    lightMode: lightThemeColors.surface,
    darkMode: darkThemeColors.surface,
  }),
  card: theme('mode', {
    lightMode: lightThemeColors.card,
    darkMode: darkThemeColors.card,
  }),
  tertiary: theme('mode', {
    lightMode: lightThemeColors.tertiary,
    darkMode: darkThemeColors.tertiary,
  }),
  control: theme('mode', {
    lightMode: lightThemeColors.control,
    darkMode: darkThemeColors.control,
  }),
  warning: theme('mode', {
    lightMode: lightThemeColors.warning,
    darkMode: darkThemeColors.warning,
  }),
  indicator: theme('mode', {
    lightMode: lightThemeColors.indicator,
    darkMode: darkThemeColors.indicator,
  }),
  userAvatar: theme('mode', {
    lightMode: lightThemeColors.userAvatar,
    darkMode: darkThemeColors.userAvatar,
  }),
};
