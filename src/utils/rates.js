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
import { valueForAddress, getCurrencySymbol } from 'utils/common';

// Constans
import { CHAIN } from 'constants/chainConstants';
import { USD } from 'constants/assetsConstants';

// Types
import type { Value } from 'models/Value';
import type { Currency, RatesByAssetAddress, RatesPerChain } from 'models/Rates';

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
