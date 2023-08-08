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

import { useTheme as useThemeSC } from 'styled-components/native';
import theme from 'styled-theming';

// Constants
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';

// Utils
import { baseColors } from 'utils/variables';

// Types
import type { Theme, ColorsByThemeProps } from 'models/Theme';

// Local
import lightThemeColors from './themes/lightTheme';
import darkThemeColors from './themes/darkTheme';

const commonColors = {
  ethereum: '#62688F',
  binance: '#f3ba2f',
  xdai: '#62a7a5',
  polygon: '#8247e5',
  white: '#FFFFFF',
  black: '#000000',
  optimism: '#ff0024',
  arbitrum: '#0097e9',
  darkViolet: '#9D2BFF',
  dodgerBlue: '#198DFF',
  preciousPersimmon: '#FD7344',
  deepViolet: '#31005c',
  caribbeanGreen: '#00e097',
  metallicViolet: '#5c0cac',
  metallicVioletLight: '#5c0cac10',
  darkPrimarySkalaton: 'rgba(31, 30, 30, 0.4)',
  darkSecondarySkalaton: 'rgba(55, 55, 55, 1)',
  lightPrimarySkalaton: 'rgba(235, 240, 246, 0.1)',
  lightSecondarySkalaton: 'rgba(252, 253, 255, 0.1)',
  purpleHeat: '#6f34a1',
};

export const semanticLightThemeColors = {
  ...commonColors,
  text: '#0A1427',
  accent: '#818EB3',
  primary: '#007AFF',
  secondaryAccent: '#EBF0F5',
  secondaryText: '#8B939E',
  tertiaryText: '#818eb3',
  background: lightThemeColors.basic070,
  border: '#EDEDED',
  positive: '#2AA057',
  positiveWeak: '#18e65b4c',
  negative: '#BD573A',
  negativeWeak: '#f1987e4c',
  neutral: '#818eb3',
  neutralWeak: '#ebf0f6',
  card: '#FFFFFF',
  tertiary: '#EBF0F6',
  control: '#FCFDFF',
  separator: lightThemeColors.basic060,
  inputField: lightThemeColors.basic060,
  indicator: '#F8E71C', // NOT IN DS BUT CURRENTLY REQUIRED
  smartWallet: '#3C71FE', // NOT IN DS BUT CURRENTLY REQUIRED
  orange: '#f57c00',
  PPNText: '#f33726',
  PPNSurface: '#0a0c78',
  danger: '#ff0005',
  helpIcon: '#f7931a',
  activeTabBarIcon: '#007AFF',
  transactionReceivedIcon: '#497391',
  link: '#007aff',
  labelTertiary: '#818eb3',
  progressBarStart: '#ca17e1',
  progressBarEnd: '#f04cfa',
  toastCloseIcon: '#ededed',
  graphPrimaryColor: '#a945ff',
  checkMark: lightThemeColors.primaryAccent130,
  checkBoxField: '#e0eeff',
  pieChartCenter: lightThemeColors.basic070,
  pieChartEmpty: '#f2f2f2',
  homeEnsNameIcon: lightThemeColors.basic000,
  buttonPrimaryBackground: lightThemeColors.basic000,
  buttonPrimaryTitle: lightThemeColors.basic050,
  buttonSecondaryBackground: lightThemeColors.basic060,
  buttonSecondaryTitle: lightThemeColors.basic000,
  buttonTextTitle: lightThemeColors.basic000,
  tabUnderline: lightThemeColors.basic000,
  pagerActive: '#000000',
  pagerInactive: '#d4d9db',
  receiveModalWarningText: '#62688f',
  hazardIconColor: '#8b939e',
  refreshControl: '#0000004C',
  pillarText: '#000000',
  exchangeScheme: lightThemeColors.basic080,
  interjectionPointText: '#0a1427',
  swiperButtonTrack: lightThemeColors.basic000,
  swiperButtonThumb: '#ebf0f6',
  modalHandleBar: '#ededed',
  toastBackgroundColor: lightThemeColors.synthetic140,
  toastTextColor: lightThemeColors.basic090,
  bannerTextColor: baseColors.white,
  basic60: '#ebf0f6',
  plrStaking: '#31005c',
  plrStakingAlt: '#45196c',
  plrStakingHighlight: '#b866ff',
  plrStakingAlert: '#e333e8',
  primarySkeleton: 'rgba(235, 240, 246, 0.1)',
  secondarySkeleton: 'rgba(252, 253, 255, 0.1)',
  purpleHeatPrimary: 'rgba(216, 171, 255, 0.33)',
  purpleHeatSecondary: 'rgba(227, 200, 250, 0.4)',
};

export const semanticDarkThemeColors = {
  ...commonColors,
  text: darkThemeColors.basic010,
  accent: '#818EB3',
  primary: '#007AFF',
  secondaryAccent: '#EBF0F5',
  secondaryText: '#7B7B7B',
  tertiaryText: '#a7a7a7',
  background: darkThemeColors.basic070,
  border: darkThemeColors.basic080,
  positive: '#00E097',
  positiveWeak: '#80ff924c',
  negative: '#FF367F',
  negativeWeak: '#ff80aa4c',
  neutral: darkThemeColors.basic020,
  neutralWeak: '#141414',
  card: darkThemeColors.basic050,
  tertiary: '#171F31',
  control: '#FCFDFF',
  separator: darkThemeColors.basic080,
  inputField: darkThemeColors.basic080,
  indicator: '#F8E71C', // TODO: add correct one when added to Design System
  smartWallet: '#3C71FE', // TODO: add correct one when added to Design System
  orange: '#f57c00',
  PPNText: '#f33726',
  PPNSurface: '#0a0c78',
  danger: '#ff0005',
  helpIcon: '#f7931a',
  activeTabBarIcon: '#FFFFFF',
  transactionReceivedIcon: '#00E097',
  link: '#fcfdff',
  labelTertiary: '#818eb3',
  progressBarStart: '#ca17e1',
  progressBarEnd: '#f04cfa',
  toastCloseIcon: '#ebf0f5',
  graphPrimaryColor: '#a945ff',
  checkMark: darkThemeColors.primaryAccent140,
  checkBoxField: darkThemeColors.basic090,
  pieChartCenter: darkThemeColors.basic050,
  pieChartEmpty: darkThemeColors.basic060,
  homeEnsNameIcon: darkThemeColors.basic010,
  buttonPrimaryBackground: baseColors.electricViolet,
  buttonPrimaryTitle: baseColors.white,
  buttonSecondaryBackground: darkThemeColors.basic020,
  buttonSecondaryTitle: darkThemeColors.basic090,
  buttonTextTitle: darkThemeColors.basic000,
  tabUnderline: baseColors.electricViolet,
  pagerActive: darkThemeColors.basic010,
  pagerInactive: '#4D4D4D',
  receiveModalWarningText: '#62688f',
  hazardIconColor: '#8b939e',
  refreshControl: '#FFFFFF4C',
  pillarText: '#e7e7e7',
  exchangeScheme: darkThemeColors.basic040,
  interjectionPointText: '#0a1427',
  swiperButtonTrack: '#520f8c',
  swiperButtonThumb: baseColors.electricViolet,
  modalHandleBar: '#4d4d4d',
  toastBackgroundColor: darkThemeColors.darkGreen,
  toastTextColor: darkThemeColors.basic010,
  bannerTextColor: baseColors.black,
  basic60: '#141414',
  plrStaking: '#31005c',
  plrStakingAlt: '#45196c',
  plrStakingHighlight: '#b866ff',
  plrStakingAlert: '#e333e8',
  primarySkeleton: 'rgba(31, 30, 30, 0.4)',
  secondarySkeleton: 'rgba(55, 55, 55, 1)',
  purpleHeatPrimary: 'rgba(59, 0, 110, 0.33)',
  purpleHeatSecondary: 'rgba(74, 0, 138, 0.4)',
};

export const themedColors = {
  text: theme('current', {
    lightTheme: semanticLightThemeColors.text,
    darkTheme: semanticDarkThemeColors.text,
  }),
  accent: theme('current', {
    lightTheme: semanticLightThemeColors.accent,
    darkTheme: semanticDarkThemeColors.accent,
  }),
  primary: theme('current', {
    lightTheme: semanticLightThemeColors.primary,
    darkTheme: semanticDarkThemeColors.primary,
  }),
  secondaryAccent: theme('current', {
    lightTheme: semanticLightThemeColors.secondaryAccent,
    darkTheme: semanticDarkThemeColors.secondaryAccent,
  }),
  secondaryText: theme('current', {
    lightTheme: semanticLightThemeColors.secondaryText,
    darkTheme: semanticDarkThemeColors.secondaryText,
  }),
  border: theme('current', {
    lightTheme: semanticLightThemeColors.border,
    darkTheme: semanticDarkThemeColors.border,
  }),
  positive: theme('current', {
    lightTheme: semanticLightThemeColors.positive,
    darkTheme: semanticDarkThemeColors.positive,
  }),
  negative: theme('current', {
    lightTheme: semanticLightThemeColors.negative,
    darkTheme: semanticDarkThemeColors.negative,
  }),
  card: theme('current', {
    lightTheme: semanticLightThemeColors.card,
    darkTheme: semanticDarkThemeColors.card,
  }),
  tertiary: theme('current', {
    lightTheme: semanticLightThemeColors.tertiary,
    darkTheme: semanticDarkThemeColors.tertiary,
  }),
  control: theme('current', {
    lightTheme: semanticLightThemeColors.control,
    darkTheme: semanticDarkThemeColors.control,
  }),
  indicator: theme('current', {
    lightTheme: semanticLightThemeColors.indicator,
    darkTheme: semanticDarkThemeColors.indicator,
  }),
  smartWallet: theme('current', {
    lightTheme: semanticLightThemeColors.smartWallet,
    darkTheme: semanticDarkThemeColors.smartWallet,
  }),
  orange: theme('current', {
    lightTheme: semanticLightThemeColors.orange,
    darkTheme: semanticDarkThemeColors.orange,
  }),
  PPNText: theme('current', {
    lightTheme: semanticLightThemeColors.PPNText,
    darkTheme: semanticDarkThemeColors.PPNText,
  }),
  PPNSurface: theme('current', {
    lightTheme: semanticLightThemeColors.PPNSurface,
    darkTheme: semanticDarkThemeColors.PPNSurface,
  }),
  danger: theme('current', {
    lightTheme: semanticLightThemeColors.danger,
    darkTheme: semanticDarkThemeColors.danger,
  }),
  helpIcon: theme('current', {
    lightTheme: semanticLightThemeColors.helpIcon,
    darkTheme: semanticDarkThemeColors.helpIcon,
  }),
  activeTabBarIcon: theme('current', {
    lightTheme: semanticLightThemeColors.activeTabBarIcon,
    darkTheme: semanticDarkThemeColors.activeTabBarIcon,
  }),
  buttonSecondaryBackground: theme('current', {
    lightTheme: semanticLightThemeColors.buttonSecondaryBackground,
    darkTheme: semanticDarkThemeColors.buttonSecondaryBackground,
  }),
  transactionReceivedIcon: theme('current', {
    lightTheme: semanticLightThemeColors.transactionReceivedIcon,
    darkTheme: semanticDarkThemeColors.transactionReceivedIcon,
  }),
  link: theme('current', {
    lightTheme: semanticLightThemeColors.link,
    darkTheme: semanticDarkThemeColors.link,
  }),
  labelTertiary: theme('current', {
    lightTheme: semanticLightThemeColors.labelTertiary,
    darkTheme: semanticDarkThemeColors.labelTertiary,
  }),
  toastCloseIcon: theme('current', {
    lightTheme: semanticLightThemeColors.toastCloseIcon,
    darkTheme: semanticDarkThemeColors.toastCloseIcon,
  }),
  graphPrimaryColor: theme('current', {
    lightTheme: semanticLightThemeColors.graphPrimaryColor,
    darkTheme: semanticDarkThemeColors.graphPrimaryColor,
  }),
  receiveModalWarningText: theme('current', {
    lightTheme: semanticLightThemeColors.receiveModalWarningText,
    darkTheme: semanticDarkThemeColors.receiveModalWarningText,
  }),
  hazardIconColor: theme('current', {
    lightTheme: semanticLightThemeColors.hazardIconColor,
    darkTheme: semanticDarkThemeColors.hazardIconColor,
  }),
};

export const defaultTheme = {
  current: LIGHT_THEME,
  colors: { ...lightThemeColors, ...semanticLightThemeColors },
};

const darkTheme = {
  current: DARK_THEME,
  colors: { ...darkThemeColors, ...semanticDarkThemeColors },
};

export function getThemeByType(themeType?: string) {
  switch (themeType) {
    case DARK_THEME:
      return darkTheme;
    default:
      return defaultTheme;
  }
}

export function useTheme(): Theme {
  return useThemeSC();
}

export function useIsDarkTheme(): boolean {
  return useTheme().current === DARK_THEME;
}

export function isLightTheme(): boolean {
  return useTheme().current === LIGHT_THEME;
}

export function getThemeColors(currentTheme: Theme = defaultTheme) {
  return currentTheme.colors;
}

export function useThemeColors() {
  return getThemeColors(useTheme());
}

export function getThemeType(currentTheme: Theme = defaultTheme) {
  return currentTheme.current;
}

export function getThemeName(currentTheme: Theme = defaultTheme) {
  return currentTheme.current.replace('Theme', '');
}

// in case there's no color by the key
const FALLBACK_COLOR = '#808080';

const generateColorsByTheme = ({ lightKey, darkKey, lightCustom, darkCustom }: ColorsByThemeProps) => {
  return {
    lightTheme: lightCustom || (lightKey && lightThemeColors[lightKey] ? lightThemeColors[lightKey] : FALLBACK_COLOR),
    darkTheme: darkCustom || (darkKey && darkThemeColors[darkKey] ? darkThemeColors[darkKey] : FALLBACK_COLOR),
  };
};

export const getColorByTheme = (props: ColorsByThemeProps) => {
  return theme('current', generateColorsByTheme(props));
};

export const getColorByThemeOutsideStyled = (currentTheme: string, colorsProps: ColorsByThemeProps) => {
  const colors = generateColorsByTheme(colorsProps);
  return currentTheme && colors[currentTheme] ? colors[currentTheme] : FALLBACK_COLOR;
};
