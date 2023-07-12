// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { utils } from 'ethers';
import { isNaN } from 'lodash';

// Utils
import { nativeAssetPerChain } from 'utils/chains';
import { wrapBigNumber } from 'utils/bigNumber';
import { valueForAddress, getCurrencySymbol, numberWithCommas } from 'utils/common';

// Constans
import { CHAIN } from 'constants/chainConstants';
import { USD } from 'constants/assetsConstants';

// Types
import type { Value } from 'models/Value';
import type { Currency, RatesByAssetAddress, RatesPerChain } from 'models/Rates';
import type { Chain } from 'models/Chain';

export const getFiatValueFromUsd = (valueInUsd: ?BigNumber | string, usdToFiatRate: ?number): ?BigNumber => {
  if (!valueInUsd || usdToFiatRate == null) return null;

  return wrapBigNumber(valueInUsd)?.times(usdToFiatRate);
};

export const getAssetRateInFiat = (rates: RatesByAssetAddress, assetAddress: ?string, fiatCurrency: Currency): number =>
  valueForAddress(rates, assetAddress)?.[fiatCurrency] ?? 0;

export const getAssetValueInFiat = (
  assetValue: ?Value,
  assetAddress: ?string,
  rates: RatesByAssetAddress,
  currency: Currency,
): ?number => {
  if (!assetValue && assetValue !== 0) return null;

  const rate = getAssetRateInFiat(rates, assetAddress, currency);
  if (!rate) return null;

  return wrapBigNumber(assetValue)?.times(rate).toNumber();
};

export const getAssetPriceInFiat = (assetAddress: ?string, rates: RatesByAssetAddress, currency: Currency): ?string => {
  if (!assetAddress) return null;

  const rate = getAssetRateInFiat(rates, assetAddress, currency);
  if (!rate) return null;

  const currencySymbol = getCurrencySymbol(currency);

  // eslint-disable-next-line i18next/no-literal-string
  return ` • ${currencySymbol}${rate?.toFixed(2)}`;
};

export const getATokenValueInFiat = (
  assetAddress: ?string,
  rates: RatesByAssetAddress,
  currency: Currency,
): ?string => {
  if (!assetAddress) return null;

  const currencySymbol = getCurrencySymbol(currency);

  const rate = getAssetRateInFiat(rates, assetAddress, currency);
  if (!rate) return `${currencySymbol}0.0`;

  return `${currencySymbol}${rate?.toFixed(2)}`;
};

export const getAssetValueFromFiat = (
  fiatValue: ?Value,
  assetAddress: ?string,
  rates: RatesByAssetAddress,
  currency: Currency,
): ?BigNumber => {
  if (!fiatValue && fiatValue !== 0) return null;

  const rate = getAssetRateInFiat(rates, assetAddress, currency);
  if (!rate) return null;

  return wrapBigNumber(fiatValue)?.dividedBy(rate);
};

export const fiatInvestmentBalance = (balance: BigNumber, rates: RatesPerChain, currency: Currency) => {
  if (!balance) return 0;
  const nativeAssetRate = rates?.[nativeAssetPerChain[CHAIN.ETHEREUM].address];

  const assetBalance: string = utils.formatEther(balance);

  const fiatAmount = (parseFloat(assetBalance) * nativeAssetRate?.[currency]) / nativeAssetRate?.[USD];

  return isNaN(fiatAmount) ? 0 : fiatAmount?.toFixed(2);
};

export const fiatTokenValue = (
  tokenValueInUSD: number,
  rates: RatesPerChain,
  currency: Currency,
  formatter?: any,
  decimals?: number,
) => {
  if (isNaN(tokenValueInUSD)) return '';
  const nativeAssetRate = rates?.[nativeAssetPerChain[CHAIN.ETHEREUM].address];
  const currencySymbol = getCurrencySymbol(currency);

  const fiatAmount = (tokenValueInUSD * nativeAssetRate?.[currency]) / nativeAssetRate?.[USD];

  const decimalsFiatValue = fiatAmount?.toFixed(decimals ?? (fiatAmount > 1 ? 2 : 4));

  const formattedNumber = formatter ? formatter(fiatAmount) : numberWithCommas(decimalsFiatValue) ?? 0;

  return `${currencySymbol + (isNaN(fiatAmount) ? '0' : formattedNumber.toString())}`;
};

export const poolsTokenValue = (
  chain: Chain,
  tokenAddress: string,
  usdValue: number,
  ratesPerChain: RatesByAssetAddress,
) => {
  if (!chain || !tokenAddress || isNaN(usdValue)) {
    return { tokenValue: null, nativeValue: null };
  }
  const address = tokenAddress.toLowerCase();
  const rates = ratesPerChain[chain];
  const nativeAssetRate = rates[nativeAssetPerChain[chain].address];
  const tokenRate = rates[address];

  let tokenValue;
  if (tokenRate?.[USD]) {
    tokenValue = usdValue / tokenRate?.[USD];
  }

  const nativeValue = usdValue / nativeAssetRate?.[USD];

  const decimalsTokenValue = tokenValue ? tokenValue?.toFixed(tokenValue > 1 ? 2 : 4) : null;
  const decimalsNativeValue = nativeValue?.toFixed(nativeValue > 1 ? 2 : 4);

  return {
    nativeValue: numberWithCommas(decimalsNativeValue),
    tokenValue: numberWithCommas(decimalsTokenValue),
  };
};
