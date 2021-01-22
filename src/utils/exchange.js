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
import { constants } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { getEnv } from 'configs/envConfig';

// models
import type { Offer } from 'models/Offer';
import type { Asset } from 'models/Asset';
import type { Theme } from 'models/Theme';
import { ETH, BTC } from 'constants/assetsConstants';
import { LIGHT_THEME } from 'constants/appSettingsConstants';
import type { Option, HorizontalOption } from 'models/Selector';
import type { AllowanceTransaction } from 'models/Transaction';

import { fiatCurrencies } from 'fixtures/assets';
import PROVIDERS_META from 'assets/exchange/providersMeta.json';

// services, utils
import { encodeContractMethod } from 'services/assets';
import { getThemeName } from './themes';
import { staticImages } from './images';
import { chainId } from './uniswap';
import { reportOrWarn, getEthereumProvider } from './common';

export type ExchangeOptions = {
  fromOptions: Option[],
  toOptions: Option[],
  horizontalOptions: HorizontalOption[],
}

export const getProviderInfo = (provider: string): Object => PROVIDERS_META.find(({ shim }) => shim === provider) || {};

export const getOfferProviderLogo = (provider?: string, theme: Theme, type: string) => {
  if (!provider) return staticImages[`exchangeDefaultLogo${theme.current === LIGHT_THEME ? 'Light' : 'Dark'}`];
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

/* eslint-disable i18next/no-literal-string */
const setAllowanceAbiFunction = [{
  name: 'approve',
  outputs: [{ type: 'bool', name: 'out' }],
  inputs: [{ type: 'address', name: '_spender' }, { type: 'uint256', name: '_value' }],
  constant: false,
  payable: false,
  type: 'function',
  gas: 38769,
}];

const ethProvider = () => getEthereumProvider(getEnv().NETWORK_PROVIDER);

export const createAllowanceTx = async (
  fromAssetAddress: string,
  clientAddress: string,
  contractAddress: string,
): Promise<AllowanceTransaction | null> => {
  if (!clientAddress) {
    reportOrWarn('Unable to set allowance, no client address provided', null, 'error');
    return null;
  }
  try {
    const encodedContractFunction = encodeContractMethod(
      setAllowanceAbiFunction,
      'approve',
      [contractAddress, constants.MaxUint256.toString()],
    );

    const txCount = await ethProvider().getTransactionCount(clientAddress);

    return {
      nonce: txCount.toString(),
      to: fromAssetAddress,
      chainId: '1',
      data: encodedContractFunction,
    };
  } catch (e) {
    reportOrWarn('Unable to set allowance', e, 'error');
    return null;
  }
};

export const isWbtcCafe = (fromAssetCode?: string): boolean => fromAssetCode === BTC;

export const calculateAmountToBuy = (askRate: number | string, amountToSell: string): string =>
  new BigNumber(askRate).multipliedBy(new BigNumber(amountToSell)).toFixed();

// check if the re-calculated order amount doesn't diverge from offer amount
export const isOrderAmountTooLow = (
  askRate: string | number,
  fromAmount: string,
  order: { expectedOutput?: string },
): boolean => {
  // no need to do anything if expectedOutput isn't provided - e.g. for Synthetix
  if (!order.expectedOutput) return false;
  try {
  // askRate is provided by offer
    const offerAmount = calculateAmountToBuy(askRate, fromAmount);
    // fix and round down because offer and order can have different decimals
    const offerAmountFixed = new BigNumber(offerAmount).toFixed(8, 1);
    const orderAmountFixed = new BigNumber(order.expectedOutput).toFixed(8, 1);
    // stop swap if order < offer
    return new BigNumber(offerAmountFixed).isGreaterThan(orderAmountFixed);
  } catch {
    return true;
  }
};

export const isAmountToSellBelowMin = (minQuantity: string | number, amountToSell: string): boolean => {
  const minQuantityBN = new BigNumber(minQuantity);
  const amountToSellBN = new BigNumber(amountToSell);
  return !minQuantityBN.isZero() && amountToSellBN.isLessThan(minQuantityBN);
};

export const isAmountToSellAboveMax = (maxQuantity: string | number, amountToSell: string): boolean => {
  const maxQuantityBN = new BigNumber(maxQuantity);
  const amountToSellBN = new BigNumber(amountToSell);
  return !maxQuantityBN.isZero() && amountToSellBN.isGreaterThan(maxQuantityBN);
};

export const getFixedQuantity = (quantity: string, decimals?: number | string): string => {
  if (!!decimals && quantity.split('.')[1]?.length <= Number(decimals)) return quantity;
  return new BigNumber(quantity).toFixed(Number(decimals) || 18, 1);
};
