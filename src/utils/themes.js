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
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import type { Theme } from 'models/Theme';

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
  userAvatar: '#d1d9e4', // NOT IN DS BUT CURRENTLY REQUIRED
  legacyWallet: '#FA574F', // NOT IN DS BUT CURRENTLY REQUIRED
  smartWallet: '#3C71FE', // NOT IN DS BUT CURRENTLY REQUIRED
  bitcoinWallet: '#F79319', // NOT IN DS BUT CURRENTLY REQUIRED
  orange: '#f57c00',
  PPNText: '#f33726',
  PPNSurface: '#0a0c78',
  smartWalletText: '#1D24D8',
  smartWalletSurface: '#f3f7ff',
  danger: '#ff0005',
  helpIcon: '#f7931a',
  popularSwaps: '#d08cb1',
  notice: '#ea480e',
  activeTabBarIcon: '#007AFF',
  inactiveTabBarIcon: '#D4D9DB',
  buttonSecondaryBackground: '#e6f1f9',
  synthetic: '#2329d6',
  transactionReceivedIcon: '#497391',
  iconBackground: '#ebf0f5',
  link: '#007aff',
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
  card: '#32426B',
  tertiary: '#171F31',
  control: '#FCFDFF',
  warning: 'blue', // TODO: add correct one when added to Design System
  indicator: '#F8E71C', // TODO: add correct one when added to Design System
  userAvatar: '#d1d9e4', // TODO: add correct one when added to Design System
  legacyWallet: '#FA574F', // TODO: add correct one when added to Design System
  smartWallet: '#3C71FE', // TODO: add correct one when added to Design System
  bitcoinWallet: '#F79319', // TODO: add correct one when added to Design System
  orange: '#f57c00',
  PPNText: '#f33726',
  PPNSurface: '#0a0c78',
  smartWalletText: '#1D24D8',
  smartWalletSurface: '#f3f7ff',
  danger: '#ff0005',
  helpIcon: '#f7931a',
  popularSwaps: '#d08cb1',
  notice: '#ea480e',
  activeTabBarIcon: '#FFFFFF',
  inactiveTabBarIcon: '#818eb3',
  buttonSecondaryBackground: '#102132',
  synthetic: '#9396ff',
  transactionReceivedIcon: '#00E097',
  iconBackground: '#222c46',
  link: '#fcfdff',
};

export const themedColors = {
  text: theme('current', {
    lightTheme: lightThemeColors.text,
    darkTheme: darkThemeColors.text,
  }),
  accent: theme('current', {
    lightTheme: lightThemeColors.accent,
    darkTheme: darkThemeColors.accent,
  }),
  primary: theme('current', {
    lightTheme: lightThemeColors.primary,
    darkTheme: darkThemeColors.primary,
  }),
  secondaryAccent: theme('current', {
    lightTheme: lightThemeColors.secondaryAccent,
    darkTheme: darkThemeColors.secondaryAccent,
  }),
  secondaryText: theme('current', {
    lightTheme: lightThemeColors.secondaryText,
    darkTheme: darkThemeColors.secondaryText,
  }),
  border: theme('current', {
    lightTheme: lightThemeColors.border,
    darkTheme: darkThemeColors.border,
  }),
  positive: theme('current', {
    lightTheme: lightThemeColors.positive,
    darkTheme: darkThemeColors.positive,
  }),
  negative: theme('current', {
    lightTheme: lightThemeColors.negative,
    darkTheme: darkThemeColors.negative,
  }),
  surface: theme('current', {
    lightTheme: lightThemeColors.surface,
    darkTheme: darkThemeColors.surface,
  }),
  card: theme('current', {
    lightTheme: lightThemeColors.card,
    darkTheme: darkThemeColors.card,
  }),
  tertiary: theme('current', {
    lightTheme: lightThemeColors.tertiary,
    darkTheme: darkThemeColors.tertiary,
  }),
  control: theme('current', {
    lightTheme: lightThemeColors.control,
    darkTheme: darkThemeColors.control,
  }),
  warning: theme('current', {
    lightTheme: lightThemeColors.warning,
    darkTheme: darkThemeColors.warning,
  }),
  indicator: theme('current', {
    lightTheme: lightThemeColors.indicator,
    darkTheme: darkThemeColors.indicator,
  }),
  userAvatar: theme('current', {
    lightTheme: lightThemeColors.userAvatar,
    darkTheme: darkThemeColors.userAvatar,
  }),
  legacyWallet: theme('current', {
    lightTheme: lightThemeColors.legacyWallet,
    darkTheme: darkThemeColors.legacyWallet,
  }),
  smartWallet: theme('current', {
    lightTheme: lightThemeColors.smartWallet,
    darkTheme: darkThemeColors.smartWallet,
  }),
  bitcoinWallet: theme('current', {
    lightTheme: lightThemeColors.bitcoinWallet,
    darkTheme: darkThemeColors.bitcoinWallet,
  }),
  orange: theme('current', {
    lightTheme: lightThemeColors.orange,
    darkTheme: darkThemeColors.orange,
  }),
  PPNText: theme('current', {
    lightTheme: lightThemeColors.PPNText,
    darkTheme: darkThemeColors.PPNText,
  }),
  PPNSurface: theme('current', {
    lightTheme: lightThemeColors.PPNSurface,
    darkTheme: darkThemeColors.PPNSurface,
  }),
  smartWalletText: theme('current', {
    lightTheme: lightThemeColors.smartWalletText,
    darkTheme: darkThemeColors.smartWalletText,
  }),
  smartWalletSurface: theme('current', {
    lightTheme: lightThemeColors.smartWalletSurface,
    darkTheme: darkThemeColors.smartWalletSurface,
  }),
  danger: theme('current', {
    lightTheme: lightThemeColors.danger,
    darkTheme: darkThemeColors.danger,
  }),
  helpIcon: theme('current', {
    lightTheme: lightThemeColors.helpIcon,
    darkTheme: darkThemeColors.helpIcon,
  }),
  popularSwaps: theme('current', {
    lightTheme: lightThemeColors.popularSwaps,
    darkTheme: darkThemeColors.popularSwaps,
  }),
  notice: theme('current', {
    lightTheme: lightThemeColors.notice,
    darkTheme: darkThemeColors.notice,
  }),
  activeTabBarIcon: theme('current', {
    lightTheme: lightThemeColors.activeTabBarIcon,
    darkTheme: darkThemeColors.activeTabBarIcon,
  }),
  inactiveTabBarIcon: theme('current', {
    lightTheme: lightThemeColors.inactiveTabBarIcon,
    darkTheme: darkThemeColors.inactiveTabBarIcon,
  }),
  buttonSecondaryBackground: theme('current', {
    lightTheme: lightThemeColors.buttonSecondaryBackground,
    darkTheme: darkThemeColors.buttonSecondaryBackground,
  }),
  synthetic: theme('current', {
    lightTheme: lightThemeColors.synthetic,
    darkTheme: darkThemeColors.synthetic,
  }),
  transactionReceivedIcon: theme('current', {
    lightTheme: lightThemeColors.transactionReceivedIcon,
    darkTheme: darkThemeColors.transactionReceivedIcon,
  }),
  iconBackground: theme('current', {
    lightTheme: lightThemeColors.iconBackground,
    darkTheme: darkThemeColors.iconBackground,
  }),
  link: theme('current', {
    lightTheme: lightThemeColors.link,
    darkTheme: darkThemeColors.link,
  }),
};

export const defaultTheme = {
  current: LIGHT_THEME,
  colors: lightThemeColors,
};

const darkTheme = {
  current: DARK_THEME,
  colors: darkThemeColors,
};

export function getThemeByType(themeType: string) {
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
