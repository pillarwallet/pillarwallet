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

import theme from 'styled-theming';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import type { Theme, ColorsByThemeProps } from 'models/Theme';
import lightThemeColors from './themes/lightTheme';
import darkThemeColors from './themes/darkTheme';

// will be removed after transition
export const lightThemeColorsOld = {
  text: '#0A1427',
  accent: '#818EB3',
  primary: '#007AFF',
  secondaryAccent: '#EBF0F5',
  secondaryText: '#8B939E',
  border: '#EDEDED',
  positive: '#2AA057',
  negative: '#BD573A',
  card: '#FFFFFF',
  tertiary: '#EBF0F6',
  control: '#FCFDFF',
  warning: '#ECA93A',
  indicator: '#F8E71C', // NOT IN DS BUT CURRENTLY REQUIRED
  userAvatar: '#d1d9e4', // NOT IN DS BUT CURRENTLY REQUIRED
  legacyWallet: '#FA574F', // NOT IN DS BUT CURRENTLY REQUIRED
  smartWallet: '#3C71FE', // NOT IN DS BUT CURRENTLY REQUIRED
  orange: '#f57c00',
  PPNText: '#f33726',
  PPNSurface: '#0a0c78',
  smartWalletText: '#1D24D8',
  smartWalletSurface: '#f3f7ff',
  danger: '#ff0005',
  helpIcon: '#f7931a',
  notice: '#ea480e',
  activeTabBarIcon: '#007AFF',
  inactiveTabBarIcon: '#D4D9DB',
  buttonSecondaryBackground: '#e6f1f9',
  synthetic: '#2329d6',
  transactionReceivedIcon: '#497391',
  iconBackground: '#ebf0f5',
  link: '#007aff',
  avatarPlaceholderBackground: '#e0eeff',
  avatarPlaceholderText: '#6690eb',
  labelTertiary: '#818eb3',
  progressBarStart: '#ca17e1',
  progressBarEnd: '#f04cfa',
  poolTogetherPink: '#e51fff',
  toastCloseIcon: '#ededed',
};

// will be removed after transition
export const darkThemeColorsOld = {
  text: '#B1BBD9',
  accent: '#818EB3',
  primary: '#007AFF',
  secondaryAccent: '#EBF0F5',
  secondaryText: '#8B939E',
  border: '#181F30',
  positive: '#00E097',
  negative: '#FF367F',
  card: '#32426B',
  tertiary: '#171F31',
  control: '#FCFDFF',
  warning: 'blue', // TODO: add correct one when added to Design System
  indicator: '#F8E71C', // TODO: add correct one when added to Design System
  userAvatar: '#d1d9e4', // TODO: add correct one when added to Design System
  legacyWallet: '#FA574F', // TODO: add correct one when added to Design System
  smartWallet: '#3C71FE', // TODO: add correct one when added to Design System
  orange: '#f57c00',
  PPNText: '#f33726',
  PPNSurface: '#0a0c78',
  smartWalletText: '#1D24D8',
  smartWalletSurface: '#f3f7ff',
  danger: '#ff0005',
  helpIcon: '#f7931a',
  notice: '#ea480e',
  activeTabBarIcon: '#FFFFFF',
  inactiveTabBarIcon: '#818eb3',
  buttonSecondaryBackground: '#102132',
  synthetic: '#9396ff',
  transactionReceivedIcon: '#00E097',
  iconBackground: '#222c46',
  link: '#fcfdff',
  avatarPlaceholderBackground: '#181f31',
  avatarPlaceholderText: '#6690eb',
  labelTertiary: '#818eb3',
  progressBarStart: '#ca17e1',
  progressBarEnd: '#f04cfa',
  poolTogetherPink: '#e51fff',
  toastCloseIcon: '#ebf0f5',
};

export const themedColors = {
  text: theme('current', {
    lightTheme: lightThemeColorsOld.text,
    darkTheme: darkThemeColorsOld.text,
  }),
  accent: theme('current', {
    lightTheme: lightThemeColorsOld.accent,
    darkTheme: darkThemeColorsOld.accent,
  }),
  primary: theme('current', {
    lightTheme: lightThemeColorsOld.primary,
    darkTheme: darkThemeColorsOld.primary,
  }),
  secondaryAccent: theme('current', {
    lightTheme: lightThemeColorsOld.secondaryAccent,
    darkTheme: darkThemeColorsOld.secondaryAccent,
  }),
  secondaryText: theme('current', {
    lightTheme: lightThemeColorsOld.secondaryText,
    darkTheme: darkThemeColorsOld.secondaryText,
  }),
  border: theme('current', {
    lightTheme: lightThemeColorsOld.border,
    darkTheme: darkThemeColorsOld.border,
  }),
  positive: theme('current', {
    lightTheme: lightThemeColorsOld.positive,
    darkTheme: darkThemeColorsOld.positive,
  }),
  negative: theme('current', {
    lightTheme: lightThemeColorsOld.negative,
    darkTheme: darkThemeColorsOld.negative,
  }),
  card: theme('current', {
    lightTheme: lightThemeColorsOld.card,
    darkTheme: darkThemeColorsOld.card,
  }),
  tertiary: theme('current', {
    lightTheme: lightThemeColorsOld.tertiary,
    darkTheme: darkThemeColorsOld.tertiary,
  }),
  control: theme('current', {
    lightTheme: lightThemeColorsOld.control,
    darkTheme: darkThemeColorsOld.control,
  }),
  warning: theme('current', {
    lightTheme: lightThemeColorsOld.warning,
    darkTheme: darkThemeColorsOld.warning,
  }),
  indicator: theme('current', {
    lightTheme: lightThemeColorsOld.indicator,
    darkTheme: darkThemeColorsOld.indicator,
  }),
  userAvatar: theme('current', {
    lightTheme: lightThemeColorsOld.userAvatar,
    darkTheme: darkThemeColorsOld.userAvatar,
  }),
  legacyWallet: theme('current', {
    lightTheme: lightThemeColorsOld.legacyWallet,
    darkTheme: darkThemeColorsOld.legacyWallet,
  }),
  smartWallet: theme('current', {
    lightTheme: lightThemeColorsOld.smartWallet,
    darkTheme: darkThemeColorsOld.smartWallet,
  }),
  orange: theme('current', {
    lightTheme: lightThemeColorsOld.orange,
    darkTheme: darkThemeColorsOld.orange,
  }),
  PPNText: theme('current', {
    lightTheme: lightThemeColorsOld.PPNText,
    darkTheme: darkThemeColorsOld.PPNText,
  }),
  PPNSurface: theme('current', {
    lightTheme: lightThemeColorsOld.PPNSurface,
    darkTheme: darkThemeColorsOld.PPNSurface,
  }),
  smartWalletText: theme('current', {
    lightTheme: lightThemeColorsOld.smartWalletText,
    darkTheme: darkThemeColorsOld.smartWalletText,
  }),
  smartWalletSurface: theme('current', {
    lightTheme: lightThemeColorsOld.smartWalletSurface,
    darkTheme: darkThemeColorsOld.smartWalletSurface,
  }),
  danger: theme('current', {
    lightTheme: lightThemeColorsOld.danger,
    darkTheme: darkThemeColorsOld.danger,
  }),
  helpIcon: theme('current', {
    lightTheme: lightThemeColorsOld.helpIcon,
    darkTheme: darkThemeColorsOld.helpIcon,
  }),
  notice: theme('current', {
    lightTheme: lightThemeColorsOld.notice,
    darkTheme: darkThemeColorsOld.notice,
  }),
  activeTabBarIcon: theme('current', {
    lightTheme: lightThemeColorsOld.activeTabBarIcon,
    darkTheme: darkThemeColorsOld.activeTabBarIcon,
  }),
  inactiveTabBarIcon: theme('current', {
    lightTheme: lightThemeColorsOld.inactiveTabBarIcon,
    darkTheme: darkThemeColorsOld.inactiveTabBarIcon,
  }),
  buttonSecondaryBackground: theme('current', {
    lightTheme: lightThemeColorsOld.buttonSecondaryBackground,
    darkTheme: darkThemeColorsOld.buttonSecondaryBackground,
  }),
  synthetic: theme('current', {
    lightTheme: lightThemeColorsOld.synthetic,
    darkTheme: darkThemeColorsOld.synthetic,
  }),
  transactionReceivedIcon: theme('current', {
    lightTheme: lightThemeColorsOld.transactionReceivedIcon,
    darkTheme: darkThemeColorsOld.transactionReceivedIcon,
  }),
  iconBackground: theme('current', {
    lightTheme: lightThemeColorsOld.iconBackground,
    darkTheme: darkThemeColorsOld.iconBackground,
  }),
  link: theme('current', {
    lightTheme: lightThemeColorsOld.link,
    darkTheme: darkThemeColorsOld.link,
  }),
  avatarPlaceholderBackground: theme('current', {
    lightTheme: lightThemeColorsOld.avatarPlaceholderBackground,
    darkTheme: darkThemeColorsOld.avatarPlaceholderBackground,
  }),
  avatarPlaceholderText: theme('current', {
    lightTheme: lightThemeColorsOld.avatarPlaceholderText,
    darkTheme: darkThemeColorsOld.avatarPlaceholderText,
  }),
  labelTertiary: theme('current', {
    lightTheme: lightThemeColorsOld.labelTertiary,
    darkTheme: darkThemeColorsOld.labelTertiary,
  }),
  toastCloseIcon: theme('current', {
    lightTheme: lightThemeColorsOld.toastCloseIcon,
    darkTheme: darkThemeColorsOld.toastCloseIcon,
  }),
};

export const defaultTheme = {
  current: LIGHT_THEME,
  colors: { ...lightThemeColors, ...lightThemeColorsOld },
};

const darkTheme = {
  current: DARK_THEME,
  colors: { ...darkThemeColors, ...darkThemeColorsOld },
};

export function getThemeByType(themeType?: string) {
  switch (themeType) {
    case DARK_THEME:
      return darkTheme;
    default:
      return defaultTheme;
  }
}

export function getThemeColors(currentTheme: Theme = defaultTheme) {
  return currentTheme.colors;
}

export function getThemeType(currentTheme: Theme = defaultTheme) {
  return currentTheme.current;
}

export function getThemeName(currentTheme: Theme = defaultTheme) {
  return currentTheme.current.replace('Theme', '');
}

export const getColorByTheme = (props: ColorsByThemeProps) => {
  const {
    lightKey,
    darkKey,
    lightCustom,
    darkCustom,
  } = props;

  // in case there's no color by the key
  const FALLBACK_COLOR = '#808080';

  return theme('current', {
    lightTheme: lightCustom || (lightKey && lightThemeColors[lightKey] ? lightThemeColors[lightKey] : FALLBACK_COLOR),
    darkTheme: darkCustom || (darkKey && darkThemeColors[darkKey] ? darkThemeColors[darkKey] : FALLBACK_COLOR),
  });
};
