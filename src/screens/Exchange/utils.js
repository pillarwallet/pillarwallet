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

import { BigNumber } from 'bignumber.js';
import type { Rates, Asset } from 'models/Asset';
import { getRate } from 'utils/assets';
import { formatFiat, formatMoney, formatAmount } from 'utils/common';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import type { Option } from 'models/Selector';

export const getBalanceInFiat = (
  baseFiatCurrency: ?string,
  assetBalance: ?string | ?number,
  rates: Rates,
  symbol: string,
): number => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const assetBalanceInFiat = assetBalance ?
    parseFloat(assetBalance) * getRate(rates, symbol, fiatCurrency) : null;
  return assetBalanceInFiat;
};

export const getAssetBalanceFromFiat = (
  baseFiatCurrency: ?string,
  fiatBalance: ?string | ?number,
  rates: Rates,
  symbol: string,
): number => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const assetBalanceFromFiat = fiatBalance ?
    parseFloat(fiatBalance) / getRate(rates, symbol, fiatCurrency) : null;
  return assetBalanceFromFiat;
};

export const getFormattedBalanceInFiat = (
  baseFiatCurrency: ?string,
  assetBalance: ?string | ?number,
  rates: Rates,
  symbol: string): string => {
  const assetBalanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
  if (!assetBalanceInFiat) return '';
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  return assetBalanceInFiat ? formatFiat(assetBalanceInFiat, fiatCurrency) : null;
};

export const getAvailable = (_min: string, _max: string, rate: string) => {
  if (!_min && !_max) {
    return 'N/A';
  }
  let min = (new BigNumber(rate)).multipliedBy(_min);
  let max = (new BigNumber(rate)).multipliedBy(_max);
  if ((min.gte(0) && min.lt(0.01)) || (max.gte(0) && max.lt(0.01))) {
    if (max.isZero()) return '>0.01';
    const maxAvailable = max.lt(0.01)
      ? '<0.01'
      : formatMoney(max.toNumber(), 2);
    return min.eq(max) || min.isZero()
      // max available displayed if equal to min or min is zero
      ? maxAvailable
      : '<0.01 - <0.01';
  }
  min = min.toNumber();
  max = max.toNumber();
  if (!min || !max || min === max) {
    return `${formatMoney(min || max, 2)}`;
  }
  return `${formatMoney(min, 2)} - ${formatMoney(max, 2)}`;
};

export const calculateAmountToBuy = (askRate: number | string, amountToSell: number | string) => {
  return (new BigNumber(askRate)).multipliedBy(amountToSell).toFixed();
};

export const getFormattedSellMax = (asset: Option): string =>
  `${formatAmount(asset.assetBalance, 2)} ${asset.symbol} (${asset.formattedBalanceInFiat.replace(' ', '')})`;

export const validateInput = (
  fromAmount: string,
  fromAsset: ?Asset,
  toAsset: ?Asset,
  errorMessage: string,
): boolean => {
  return !errorMessage && +fromAmount && fromAmount[fromAmount.length - 1] !== '.' && fromAsset && toAsset;
};
