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

import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { getCurrencySymbol, getDecimalPlaces } from 'utils/common';

/**
 * Modern formatting functions.
 *
 * Common assumptions:
 * - output user-facing strings
 * - numeric input as BigNumber or number
 * - accepts null and undefined values but returns null instead of formatted value as well as NaNs and ininity
 */

type FormatValueOptions = {|
  decimalPlaces?: number, // default: undefined -> full precision
  stripTrailingZeros?: boolean, // default: false
|};

/**
 * Generic formattting function.
 *
 * Does not make assumption about formatted output.
 */
export function formatValue(value: ?BigNumber | number, options?: FormatValueOptions) {
  value = wrapBigNumberOrNil(value);
  if (!value || !value.isFinite()) return null;

  const stripTrailingZeros = options?.stripTrailingZeros ?? false;

  if (options?.decimalPlaces != null) {
    value = value?.decimalPlaces(options?.decimalPlaces, BigNumber.ROUND_DOWN);
  }

  return stripTrailingZeros ? value.toFormat() : value.toFormat(options?.decimalPlaces, BigNumber.ROUND_DOWN);
}

/**
 * Format percent value.
 * By defaults outputs 1 decimal places, without stripping zeros.
 *
 * Examples:
 *   0.5 => '50.0%'
 *   -0.01234 => '-1.2%'
 *
 */
export function formatPercentValue(value: ?BigNumber, options?: FormatValueOptions) {
  if (!value || !value.isFinite()) return null;

  return t('percentValue', { value: formatValue(value.multipliedBy(100), { decimalPlaces: 1, ...options }) });
}

/**
 * Format fiat value, for use cases such as balance.
 */
export function formatFiatValue(value: ?BigNumber | number, currency?: string, options?: FormatValueOptions) {
  const formattedValue = formatValue(value, { decimalPlaces: 2, ...options });
  if (!formattedValue) return null;

  if (!currency) return formattedValue;

  const currencyValue = t('fiatValue', { value: formattedValue, symbol: getCurrencySymbol(currency) });

  return BigNumber(formattedValue).lt(0.01) && BigNumber(formattedValue).gt(0)
    ? '< '.concat(currencyValue)
    : currencyValue;
}

/**
 * Formats fiat change as `+ $100.00`.
 * Format fiat value with plus or minus sign, for use cases such as change in balance.
 */
export function formatFiatChange(change: ?BigNumber, currency?: string, options?: FormatValueOptions) {
  const formattedAbsValue = formatFiatValue(change?.abs(), currency, options);
  if (!formattedAbsValue) return null;

  return change?.gte(0)
    ? t('positiveValue', { value: formattedAbsValue })
    : t('negativeValue', { value: formattedAbsValue });
}

/**
 * Format token value without symbol change without + sign.
 * Default number of decimal places depends on token symbol and trailing zeroes are stripped.
 */
export function formatTokenValueWithoutSymbol(value: ?BigNumber, symbol?: string, options?: FormatValueOptions) {
  if (!value || !value.isFinite()) return null;

  const decimalPlaces = getDecimalPlaces(symbol);
  const formattedValue = formatValue(value.abs(), { decimalPlaces, ...options });

  return value.gte(0) ? formattedValue : t('negativeValue', { value: formattedValue });
}

/**
 * Format token value change without + sign.
 * Default number of decimal places depends on token symbol and trailing zeroes are stripped.
 */
export function formatTokenValue(value: ?BigNumber, symbol?: string, options?: FormatValueOptions) {
  if (!value || !value.isFinite()) return null;

  const decimalPlaces = getDecimalPlaces(symbol);
  const formattedValue = formatValue(value.abs(), { decimalPlaces, ...options });

  return value.gte(0)
    ? t('tokenValue', { value: formattedValue, token: symbol })
    : t('negativeTokenValue', { value: formattedValue, token: symbol });
}

/**
 * Format token value change with +/- sign.
 * Default number of decimal places depends on token symbol and trailing zeroes are stripped.
 */
export function formatTokenChange(value: ?BigNumber, symbol?: string, options?: FormatValueOptions) {
  if (!value || !value.isFinite()) return null;

  const decimalPlaces = getDecimalPlaces(symbol);
  const formattedValue = formatValue(value.abs(), { decimalPlaces, ...options });

  return value.gte(0)
    ? t('positiveTokenValue', { value: formattedValue, token: symbol })
    : t('negativeTokenValue', { value: formattedValue, token: symbol });
}

export function formatExchangeRate(
  rate: ?BigNumber | number,
  fromSymbol: string,
  toSymbol: string,
  reverse: boolean = false,
) {
  rate = wrapBigNumberOrNil(rate);
  if (!rate || !rate.isFinite()) return null;

  if (reverse) {
    rate = BigNumber(1).dividedBy(rate);
    return formatExchangeRate(rate, toSymbol, fromSymbol);
  }

  const rateString = formatExchangeRateWithoutSymbol(rate);
  return t('exchangeRate', { rate: rateString, fromSymbol, toSymbol });
}

export function formatExchangeRateWithoutSymbol(rate: ?BigNumber | number) {
  rate = wrapBigNumberOrNil(rate);
  if (!rate || !rate.isFinite()) return null;

  if (rate.gt(1000)) {
    return formatValue(rate, { decimalPlaces: 0 });
  }

  if (rate.gt(1)) {
    return formatValue(rate, { decimalPlaces: 2 });
  }

  if (rate.gt(0.00001)) {
    return formatValue(rate, { decimalPlaces: 5 });
  }

  return '<0.00001';
}
