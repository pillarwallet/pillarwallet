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
import { isTest } from 'utils/environment';
import { printLog } from 'utils/common';

export default class InMemoryStorage {
  isDebug: boolean;
  data: Object;

  constructor(data?: Object = {}, isDebug?: boolean = false) {
    this.data = data;
    this.isDebug = isDebug;
  }

  getItem(key: string) {
    this.debug(`storage:getItem: ${key}`, this.data[key]);
    return this.data[key];
  }

  setItem(key: string, value: any) {
    this.debug(`storage:setItem: ${key}`, value);
    this.data[key] = value;
    return this;
  }

  removeItem(key: string) {
    this.debug(`storage:removeItem: ${key}`);
    if (this.data[key]) {
      delete this.data[key];
    }
    return this;
  }

  getAll() {
    this.debug('storage:getAll');
    return this.data;
  }

  debug(...params: any) {
    if (this.isDebug && !isTest) {
      printLog(params);
    }
  }
}
