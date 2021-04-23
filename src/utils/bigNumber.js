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

/**
 * Returns sum of nullable BigNumbers.
 *
 * It returns 0 when input is empty or contain only nulls.
 */
export function sum(values: (?BigNumber)[]): BigNumber {
  let total = BigNumber(0);

  values.forEach((value) => {
    if (value) {
      total = total.plus(value);
    }
  });

  return total;
}

/**
 * Returns sum of nullable BigNumbers.
 *
 * It returns null when input is empty or contain only nulls.
 */
export function sumOrNull(values: (?BigNumber)[]): BigNumber | null {
  return values.some((v) => v != null) ? sum(values) : null;
}
