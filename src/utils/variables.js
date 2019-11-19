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

import { responsiveSize } from 'utils/ui';

export const baseColors = {
  sunYellow: '#f8e71c', // indicator
  clearBlue: '#2077fd', // used for hyperlinks
  mediumGray: '#C6CACD', // used for bottom navigation to match icon color

  userAvatar: '#a9aeb8', // NOT IN DS (greyser - #d1d7dd)

  negative: '#bd573a', // ex burningFire (#F56C07) and fireEngineRed (#ff0005) and vividOrange (#ffc021) for toast
  primary: '#007AFF', // ex electricBlue and primaryIntense (#2329d6)
  positive: '#2aa057', // ex freshEucalyptus (#2AA057) and jadeGreen (#2aa157) and limeGreen (#47d764) for toast
  surface: '#fafafa', // ex snowWhite and lighterGray
  border: '#ededed', // ex lightGray (for borders) and mediumLightGray and gallery (#efefef)
  tertiary: '#ebf0f6', // ex mediumGray (#C6CACD)
  secondaryAccent: '#ebf0f5', // ex mediumGray (#C6CACD) and lightGray (#f5f5f5)
  secondaryText: '#8b939e', // ex darkGray (#8B939E) and coolGrey (#8B939E)
  text: '#0a1427', // ex slateBlack
  accent: '#818eb3', // ex blueYonder (818eb3) // pigeonPost (#9fb7db) (for shadow on checkbox)

  white: '#ffffff',
  black: '#000000',

  rose: '#f5078d', // CONNECTION EVENT HEADER
  cerulean: '#07b0f5', // CONNECTION EVENT HEADER
  shark: '#292c33', // BADGE / COLLECTIBLE EVENT HERADER

  tropicalBlue: '#CAE1F8', // CHAT
  zumthor: '#EBF5FF', // CHAT

  ultramarine: '#0a0c78', // PPN INTRO
  pomegranate: '#f33726', // PPN INTRO
  darkOrange: '#ff8d04', // PPN INTRO

  zircon: '#f3f7ff', // SMART WALLET INTRO
  persianBlue: '#1D24D8', // // SMART WALLET INTRO

  stratos: '#000260', // CHECKBOX
};

export const accentColors = {
  keyWalletHeader: '#f9584f',
  smartWalletHeader: '#3c71ff',
};

export const brandColors = [
  baseColors.sunYellow,
  baseColors.negative,
];

export const fontSizes = {
  tiny: 10,
  small: 12,
  regular: 14,
  medium: 16,
  big: 18,
  large: 24,
  giant: 36,
  rSmall: responsiveSize(12),
  rRegular: responsiveSize(14),
  rBig: responsiveSize(18),
  rLarge: responsiveSize(24),
  rJumbo: responsiveSize(64),
};

export const lineHeights = {
  tiny: 14,
  small: 18,
  regular: 22,
  medium: 24,
  big: 28,
  large: 38,
  giant: 54,
  rSmall: responsiveSize(18),
  rRegular: responsiveSize(22),
  rBig: responsiveSize(28),
  rLarge: responsiveSize(38),
  rJumbo: responsiveSize(74),
};

export const fontStyles = {
  tiny: { fontSize: fontSizes.tiny, lineHeight: lineHeights.tiny },
  small: { fontSize: fontSizes.small, lineHeight: lineHeights.small },
  regular: { fontSize: fontSizes.regular, lineHeight: lineHeights.regular },
  medium: { fontSize: fontSizes.medium, lineHeight: lineHeights.medium },
  big: { fontSize: fontSizes.big, lineHeight: lineHeights.big },
  large: { fontSize: fontSizes.large, lineHeight: lineHeights.large },
  giant: { fontSize: fontSizes.giant, lineHeight: lineHeights.giant },
  rSmall: { fontSize: fontSizes.rSmall, lineHeight: lineHeights.rSmall },
  rRegular: { fontSize: fontSizes.rRegular, lineHeight: lineHeights.rRegular },
  rBig: { fontSize: fontSizes.rBig, lineHeight: lineHeights.rBig },
  rLarge: { fontSize: fontSizes.rLarge, lineHeight: lineHeights.rLarge },
  rJumbo: { fontSize: fontSizes.rJumbo, lineHeight: lineHeights.rJumbo },
};

export const spacing = {
  rhythm: 20,
  small: 8,
  medium: 12,
  mediumLarge: 16,
  large: 20,
};

export const itemSizes = {
  avatarCircleSmall: 44,
  avatarCircleMedium: 54,
};

export const fontTrackings = {
  tiny: 0.1,
  small: 0.2,
  medium: 0.3,
  mediumLarge: 0.4,
  large: 0.5,
};

export const appFont = {
  regular: 'EuclidCircularB-Regular',
  medium: 'EuclidCircularB-Medium',
  bold: 'EuclidCircularB-Bold',
  light: 'EuclidCircularB-Light',
};
