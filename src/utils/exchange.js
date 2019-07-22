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
import CookieManager from 'react-native-cookies';
import {
  PROVIDER_CHANGELLY,
  PROVIDER_SHAPESHIFT,
  PROVIDER_UNISWAP,
  PROVIDER_ZEROX,
  PROVIDER_MOONPAY,
  PROVIDER_SENDWYRE,
} from 'constants/exchangeConstants';

import fiatCurrenciesConfig from 'configs/fiatCurrenciesConfig';

export const getProviderDisplayName = (provider?: string) => {
  switch (provider) {
    case PROVIDER_SHAPESHIFT:
      return 'ShapeShift';
    case PROVIDER_UNISWAP:
      return 'Uniswap';
    case PROVIDER_ZEROX:
      return '0x';
    case PROVIDER_CHANGELLY:
      return 'Changelly';
    case PROVIDER_SENDWYRE:
      return 'SendWyre';
    case PROVIDER_MOONPAY:
      return 'MoonPay';
    default:
      return 'Unknown';
  }
};

const zeroxLogo = require('assets/images/exchangeProviders/logo_0x.png');
const shapeshiftLogo = require('assets/images/exchangeProviders/logo_shapeshift.png');
const uniswapLogo = require('assets/images/exchangeProviders/logo_uniswap.png');
const changellyLogo = require('assets/images/exchangeProviders/logo_changelly.png');
const sendWyreLogo = require('assets/images/exchangeProviders/logo_sendwyre.png');
const moonPayLogo = require('assets/images/exchangeProviders/logo_moonpay.png');

export const getProviderLogo = (provider?: string) => {
  switch (provider) {
    case PROVIDER_SHAPESHIFT:
      return shapeshiftLogo;
    case PROVIDER_UNISWAP:
      return uniswapLogo;
    case PROVIDER_ZEROX:
      return zeroxLogo;
    case PROVIDER_CHANGELLY:
      return changellyLogo;
    case PROVIDER_MOONPAY:
      return moonPayLogo;
    case PROVIDER_SENDWYRE:
      return sendWyreLogo;
    default:
      return '';
  }
};

export const checkFiatProvider = (provider: string) => {
  switch (provider) {
    case PROVIDER_MOONPAY:
    case PROVIDER_SENDWYRE:
      return true;
    default:
      return false;
  }
};

export const checkFiatCurrency = (symbol: string) => {
  return fiatCurrenciesConfig.find(currency => currency.symbol === symbol);
};

export const clearWebViewCookies = () => {
  CookieManager.clearAll(true).then(() => {}).catch(() => null);
  CookieManager.clearAll(false).then(() => {}).catch(() => null);
};
