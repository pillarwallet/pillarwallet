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
import { ethers } from 'ethers';

// Constants
import { USD } from 'constants/assetsConstants';

// Utils
import { wrapBigNumber } from 'utils/bigNumber';
import { formatFiat } from 'utils/common';

// Types
import type { Currency, RatesByAssetAddress } from 'models/Rates';


export const getUsdToFiatRate = (rates: RatesByAssetAddress, currency: Currency): ?number => {
  // No need to calculate rate for USD/USD.
  if (currency === USD) return 1;

  // will select native asset rates to calculate between
  const nativeAssetRates = rates[ethers.constants.AddressZero];
  if (!nativeAssetRates || !nativeAssetRates[currency] || !nativeAssetRates[USD]) {
    return null;
  }

  return nativeAssetRates[currency] / nativeAssetRates[USD];
};

export const getFiatValueFromUsd = (valueInUsd: ?BigNumber | string, usdToFiatRate: ?number): ?BigNumber => {
  if (!valueInUsd || usdToFiatRate == null) return null;

  return wrapBigNumber(valueInUsd)?.times(usdToFiatRate);
};

export const convertValueInUsdToFiat = (
  value: number,
  rates: RatesByAssetAddress = {},
  fiatCurrency: Currency,
): number => {
  const usdToFiatRate = getUsdToFiatRate(rates, fiatCurrency);

  if (!usdToFiatRate) return 0;

  return value * usdToFiatRate;
};

export const getRate = (
  rates: RatesByAssetAddress,
  assetAddress: string,
  fiatCurrency: Currency,
): number => rates?.[assetAddress]?.[fiatCurrency] ?? 0;

export const getFormattedRate = (
  rates: RatesByAssetAddress,
  amount: number,
  assetAddress: string,
  fiatCurrency: Currency,
): string => {
  const amountInFiat = amount * getRate(rates, assetAddress, fiatCurrency);

  return formatFiat(amountInFiat, fiatCurrency);
};
