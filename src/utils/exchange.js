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
import { EXCHANGE_URL } from 'react-native-dotenv';
import { WETH } from '@uniswap/sdk';
import get from 'lodash.get';
import type { ProvidersMeta, Offer } from 'models/Offer';
import type { Asset } from 'models/Asset';
import { fiatCurrencies } from 'fixtures/assets';
import type { Theme } from 'models/Theme';
import { getThemeName } from './themes';
import { chainId } from './uniswap';

export const getOfferProviderLogo = (providersMeta: ProvidersMeta, provider?: string, theme: Theme, type: string) => {
  if (!provider) return '';
  const providerInfo = providersMeta.find(({ shim }) => shim === provider);
  const themeName = getThemeName(theme);
  if (providerInfo) {
    const providerIconPath = get(providerInfo, `img.${type}.${themeName}`, '');
    return { uri: `${EXCHANGE_URL}/v2.0${providerIconPath}` };
  }
  return '';
};

export const getCryptoProviderName = (providersMeta: ProvidersMeta, provider: string) => {
  const providerInfo = providersMeta.find(({ shim }) => shim === provider) || {};
  const { name } = providerInfo;
  return name;
};

export const isFiatCurrency = (symbol: string) => {
  return fiatCurrencies.find(currency => currency.symbol === symbol);
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
  return fromAssetSymbol === 'ETH' && contractAddress === WETH[chainId].address;
};
