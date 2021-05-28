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

import { omitBy, isNil } from 'lodash';

export type Record<Value, Key: string = string> = { [Key]: Value };

/**
 * Properly typed version of `Object.values`.
 */
export function recordValues<Value>(record: Record<Value>): Value[] {
  return Object.keys(record).map((key) => record[key]);
}

/**
 * Improved version of lodash mapValue.
 */
export function mapRecordValues<Value, Target, Key: string>(
  record: Record<Value, Key>,
  selector: (value: Value, key: Key) => Target,
): Record<Target> {
  const result = {};
  Object.keys(record).forEach((key) => {
    result[key] = selector(record[key], key);
  });

  return result;
}

/**
 * Returns a copy of the object but without any `undefined` or `null` properties.
 */
export const omitNilProps = <T: { [string]: any }>(object: T): T => omitBy(object, isNil);
