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
import { Platform } from 'react-native';
import { WETH } from '@uniswap/sdk';
import get from 'lodash.get';
import type { Offer } from 'models/Offer';
import type { Asset } from 'models/Asset';
import { fiatCurrencies } from 'fixtures/assets';
import type { Theme } from 'models/Theme';
import { ETH, BTC, WBTC } from 'constants/assetsConstants';
import type { Option, HorizontalOption } from 'models/Selector';
import PROVIDERS_META from 'assets/exchange/providersMeta.json';
import { getThemeName } from './themes';
import { staticImages } from './images';
import { chainId } from './uniswap';

export type ExchangeOptions = {
  fromOptions: Option[],
  toOptions: Option[],
  horizontalOptions: HorizontalOption[],
}

export const getProviderInfo = (provider: string): Object => PROVIDERS_META.find(({ shim }) => shim === provider) || {};

export const getOfferProviderLogo = (provider?: string, theme: Theme, type: string) => {
  if (!provider) return '';
  const providerInfo = getProviderInfo(provider);
  const themeName = getThemeName(theme);
  if (providerInfo) {
    const providerIconName = get(providerInfo, `img.${type}.${themeName}`, '');
    const image = staticImages[providerIconName] || '';
    return image;
  }
  return '';
};

export const getCryptoProviderName = (provider: string) => {
  const providerInfo = getProviderInfo(provider);
  const { name } = providerInfo;
  return name;
};

export const isFiatCurrency = (symbol: string) => {
  return !!fiatCurrencies.find(currency => currency.symbol === symbol);
};

export const clearWebViewCookies = () => {
  if (Platform.OS === 'ios') {
    CookieManager.clearAll(true).then(() => {}).catch(() => null);
    CookieManager.clearAll(false).then(() => {}).catch(() => null);
  } else {
    CookieManager.clearAll().then(() => {}).catch(() => null);
  }
};

export const parseOffer = (
  fromAsset: Asset,
  toAsset: Asset,
  allowanceSet: boolean,
  askRate: string,
  provider: string,
): Offer => {
  return {
    fromAsset,
    toAsset,
    allowanceSet,
    askRate,
    maxQuantity: '0',
    minQuantity: '0',
    extra: undefined,
    _id: provider,
    description: '',
    provider,
  };
};

export const isWethConvertedTx = (fromAssetSymbol: string, contractAddress: string): boolean => {
  return fromAssetSymbol === ETH && contractAddress === WETH[chainId].address;
};

export const isWbtcCafe = (fromAsset: Option, toAsset: Option): boolean =>
  fromAsset.symbol === BTC || (fromAsset.symbol === WBTC && toAsset.symbol === BTC);
