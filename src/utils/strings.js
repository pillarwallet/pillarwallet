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

type FormattedValueOptions = {|
  isPositive?: boolean,
  noSymbol?: boolean
|}

export const capitalize = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getFormattedValue = (value: string, token: string, options: ?FormattedValueOptions) => {
  const { isPositive, noSymbol } = options || {};
  if (noSymbol || isPositive === 'undefined') return t('tokenValue', { value, token });
  if (isPositive) return t('positiveTokenValue', { value, token });
  return t('negativeTokenValue', { value, token });
};
