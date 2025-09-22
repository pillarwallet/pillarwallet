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

import * as DateFns from 'date-fns';

/**
 * This files encapsulates Date FNS library as well as provides custom implementations for some
 * of the functions that are problematically slow on iOS.
 *
 * Experimentally I discovered that `Date` mutation functions (like `setHours`) are really slow, while `format`
 * is nearly instant. This manifests itself when using functions like `isSameDay`, `isToday`, etc.
 *
 * These optimization are need only when running under JavaScriptCore and are not needed under V8 (debugger).
 */

export * from 'date-fns';

export const isSameDay = (first: Date, second: Date): boolean => {
  // eslint-disable-next-line i18next/no-literal-string
  const dateFormat = 'yyyy-MM-dd';
  return DateFns.format(first, dateFormat) === DateFns.format(second, dateFormat);
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const isYesterday = (date: Date): boolean => {
  return isSameDay(date, DateFns.subDays(new Date(), 1));
};

export const formatDate = (date: ?Date, format?: string): string => {
  if (!date) return '';
  if (!format) return '';

  return DateFns.format(date, format);
};

export const currentDate = (): string => {
  return new Date().toLocaleDateString();
};

export const currentTime = (): string => {
  return new Date().toLocaleTimeString();
};
