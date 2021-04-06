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
import t from 'translations/translate';

import { getCurrencySymbol } from 'utils/common';

/**
 * Modern formatting functions.
 *
 * Common assumptions:
 * - numeric input as BigNumber,
 * - accepts null and undefined values but returns null instead of formatted value as well as NaNs and ininity,
 */

type FormatValueOptions = {|
  decimalPlaces?: number; // default: undefined -> truncate factional zeros
|};

/**
 * 1000 => 1,000
 */
export function formatValue(value: ?BigNumber, options?: FormatValueOptions) {
  if (!value || !value.isFinite()) return null;

  const format = {
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
  };

  // $FlowFixMe: incorrect flow-typed `decimalPlaces` nullability
  return value.toFormat(options?.decimalPlaces, BigNumber.ROUND_DOWN, format);
}

/**
 * 0.5 => '50%'
 * -0.01234 => '-1,23%'
 */
export function formatPercentValue(value: ?BigNumber) {
  if (!value || !value.isFinite()) return null;

  return t('percentValue', { value: formatValue(value.multipliedBy(100), { decimalPlaces: 2 }) });
}

/**
 * 0.5 => '+50%'
 * -0.01234 => '-1,23%'
 */
export function formatPercentChange(value: ?BigNumber) {
  if (!value || !value.isFinite()) return null;

  return value.gte(0)
    ? t('positivePercentValue', { value: formatValue(value.multipliedBy(100), { decimalPlaces: 2 }) })
    : t('percentValue', { value: formatValue(value.multipliedBy(100), { decimalPlaces: 2 }) });
}

/**
 * 1000 => '1.00K'
 * 1234000 => '1.23M'
 */
export function formatValueWithUnit(value: ?BigNumber) {
  if (!value || !value.isFinite()) return null;

  const threshold = 0.85;

  if (value.gte(threshold * 1e12)) return t('units.1e12', { value: value.dividedBy(1e12).toFixed(2) });
  if (value.gte(threshold * 1e9)) return t('units.1e9', { value: value.dividedBy(1e9).toFixed(2) });
  if (value.gte(threshold * 1e6)) return t('units.1e6', { value: value.dividedBy(1e6).toFixed(2) });
  if (value.gte(threshold * 1e3)) return t('units.1e3', { value: value.dividedBy(1e3).toFixed(2) });
  return value.toFixed(2);
}

type FormatFiatValueOptions = {|
  exact: boolean, // default: false
|};

export function formatFiatValue(value: ?BigNumber, currency?: string, options?: FormatFiatValueOptions) {
  const formattedValue = options?.exact ? formatValue(value, { decimalPlaces: 2 }) : formatValueWithUnit(value);
  if (!formattedValue) return null;

  return currency ? t('fiatValue', { value: formattedValue, symbol: getCurrencySymbol(currency) }) : formattedValue;
}

/**
 * Formats profit as `+10.00% ($100.00)`.
 *
 * Handles edge cases of missing profit and/or balance values.
 */
export function formatFiatProfit(profit: ?BigNumber, balance: ?BigNumber, currency: string) {
  if (!profit || !profit.isFinite()) return null;

  if (profit.isZero()) return formatPercentChange(BigNumber(0));

  const formattedProfitInFiat = formatFiatValue(profit, currency);
  const formattedProfitInPercent = balance != null ? formatPercentChange(profit.dividedBy(balance)) : null;

  if (formattedProfitInFiat && formattedProfitInPercent) {
    return `${formattedProfitInPercent} (${formattedProfitInFiat})`;
  }

  if (formattedProfitInFiat) return formattedProfitInFiat;

  return null;
}
