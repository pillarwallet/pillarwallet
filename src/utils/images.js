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
const pillarLogo = require('assets/images/pillar-logo-pixel.png');
const pillarLogoSmallLight = require('assets/images/logo-small-on-light.png');
const pillarLogoSmallDark = require('assets/images/logo-small-on-dark.png');
const actionButtonBackgroundLight = require('assets/images/bg_action_button.png');
const actionButtonBackgroundDark = require('assets/images/bg_action_button_dark.png');
const actionButtonBackgroundLightDisabled = require('assets/images/bg_action_button_disabled.png');
const actionButtonBackgroundDarkDisabled = require('assets/images/bg_action_button_dark_disabled.png');
const keyWalletIcon = require('assets/icons/icon_key_wallet.png');
const keyWalletIconDark = require('assets/icons/key_wallet_dark.png');
const smartWalletIcon = require('assets/icons/icon_smart_wallet.png');
const smartWalletIconDark = require('assets/icons/icon_smart_wallet_dark.png');
const PPNIcon = require('assets/icons/icon_PPN.png');
const swActivatedLight = require('assets/images/swActivatedLight.png');
const swActivatedDark = require('assets/images/swActivatedDark.png');
const emailIconLight = require('assets/icons/icon_email_light.png');
const emailIconDark = require('assets/icons/icon_email_dark.png');
const phoneIconLight = require('assets/icons/icon_phone_light.png');
const phoneIconDark = require('assets/icons/icon_phone_dark.png');
const exchangeIconLight = require('assets/icons/exchange.png');
const exchangeIconDark = require('assets/icons/exchange_dark.png');
const walletIconLight = require('assets/icons/iconRoundedWalletLight.png');
const walletIconDark = require('assets/icons/iconRoundedWalletDark.png');
const personIconLight = require('assets/icons/iconRoundedPersonLight.png');
const personIconDark = require('assets/icons/iconRoundedPersonDark.png');
const directIconLight = require('assets/icons/direct.png');
const directIconDark = require('assets/icons/direct_dark.png');

// exchange providers
const uniswapLightVertical = require('assets/images/exchangeProviders/uniswapLightVertical.png');
const uniswapLightHorizontal = require('assets/images/exchangeProviders/uniswapLightHorizontal.png');
const uniswapLightMonochrome = require('assets/images/exchangeProviders/uniswapLightMonochrome.png');
const oneinchLightVertical = require('assets/images/exchangeProviders/oneinchLightVertical.png');
const oneinchLightHorizontal = require('assets/images/exchangeProviders/oneinchLightHorizontal.png');
const oneinchLightMonochrome = require('assets/images/exchangeProviders/oneinchLightMonochrome.png');
const uniswapDarkVertical = require('assets/images/exchangeProviders/uniswapDarkVertical.png');
const uniswapDarkHorizontal = require('assets/images/exchangeProviders/uniswapDarkHorizontal.png');
const uniswapDarkMonochrome = require('assets/images/exchangeProviders/uniswapDarkMonochrome.png');
const oneinchDarkVertical = require('assets/images/exchangeProviders/oneinchDarkVertical.png');
const oneinchDarkHorizontal = require('assets/images/exchangeProviders/oneinchDarkHorizontal.png');
const oneinchDarkMonochrome = require('assets/images/exchangeProviders/oneinchDarkMonochrome.png');

// patterns
const landingPattern = require('assets/images/patterns/onboarding_pattern_top.png');

function getImageByTheme(currentTheme, values) {
  return values[currentTheme];
}

export const images = (theme: Theme) => {
  const currentTheme = getThemeType(theme);
  return {
    towellie: getImageByTheme(currentTheme, {
      lightTheme: patternPlaceholderLight,
      darkTheme: patternPlaceholderDark,
    }),
    genericToken: getImageByTheme(currentTheme, {
      lightTheme: genericTokenLight,
      darkTheme: genericTokenDark,
    }),
    pillarLogo: getImageByTheme(currentTheme, {
      lightTheme: pillarLogo,
      darkTheme: pillarLogo,
    }),
    pillarLogoSmall: getImageByTheme(currentTheme, {
      lightTheme: pillarLogoSmallLight,
      darkTheme: pillarLogoSmallDark,
    }),
    actionButtonBackground: getImageByTheme(currentTheme, {
      lightTheme: actionButtonBackgroundLight,
      darkTheme: actionButtonBackgroundDark,
    }),
    actionButtonBackgroundDisabled: getImageByTheme(currentTheme, {
      lightTheme: actionButtonBackgroundLightDisabled,
      darkTheme: actionButtonBackgroundDarkDisabled,
    }),
    keyWalletIcon: getImageByTheme(currentTheme, {
      lightTheme: keyWalletIcon,
      darkTheme: keyWalletIconDark,
    }),
    smartWalletIcon: getImageByTheme(currentTheme, {
      lightTheme: smartWalletIcon,
      darkTheme: smartWalletIconDark,
    }),
    PPNIcon: getImageByTheme(currentTheme, {
      lightTheme: PPNIcon,
      darkTheme: PPNIcon,
    }),
    swActivated: getImageByTheme(currentTheme, {
      lightTheme: swActivatedLight,
      darkTheme: swActivatedDark,
    }),
    roundedEmailIcon: getImageByTheme(currentTheme, {
      lightTheme: emailIconLight,
      darkTheme: emailIconDark,
    }),
    roundedPhoneIcon: getImageByTheme(currentTheme, {
      lightTheme: phoneIconLight,
      darkTheme: phoneIconDark,
    }),
    landingPattern: getImageByTheme(currentTheme, {
      lightTheme: landingPattern,
      darkTheme: landingPattern,
    }),
    exchangeIcon: getImageByTheme(currentTheme, {
      lightTheme: exchangeIconLight,
      darkTheme: exchangeIconDark,
    }),
    walletIcon: getImageByTheme(currentTheme, {
      lightTheme: walletIconLight,
      darkTheme: walletIconDark,
    }),
    personIcon: getImageByTheme(currentTheme, {
      lightTheme: personIconLight,
      darkTheme: personIconDark,
    }),
    directIcon: getImageByTheme(currentTheme, {
      lightTheme: directIconLight,
      darkTheme: directIconDark,
    }),
  };
};

export const staticImages = {
  uniswapLightVertical,
  uniswapLightHorizontal,
  uniswapLightMonochrome,
  oneinchLightVertical,
  oneinchLightHorizontal,
  oneinchLightMonochrome,
  uniswapDarkVertical,
  uniswapDarkHorizontal,
  uniswapDarkMonochrome,
  oneinchDarkVertical,
  oneinchDarkHorizontal,
  oneinchDarkMonochrome,
};

export const isSvgImage = (uri: ?string) => {
  return uri && uri.endsWith('.svg');
};
