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

import t from 'translations/translate';
import { formatTokenAmount } from './common';

type FormattedValueOptions = {|
  isPositive?: boolean,
  noSymbol?: boolean
|}

export const capitalize = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getFormattedValue = (tokenValue: string, token: string, options: ?FormattedValueOptions) => {
  const { isPositive, noSymbol } = options || {};
  const value = formatTokenAmount(tokenValue, token);
  if (noSymbol || typeof isPositive === 'undefined') return t('tokenValue', { value, token });
  if (isPositive) return t('positiveTokenValue', { value, token });
  return t('negativeTokenValue', { value, token });
};

export const caseInsensitiveIncludes = (baseString: ?string, stringToFind: ?string) =>
  !!baseString && baseString.toUpperCase().includes(stringToFind?.toUpperCase() ?? '');

// Source: https://stackoverflow.com/a/41543705
export const stripEmoji = (text: string): string => {
  return text.replace(
    // eslint-disable-next-line max-len
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    '',
  );
};
