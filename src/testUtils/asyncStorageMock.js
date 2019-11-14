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

import type { JestMockT } from 'jest';

// required to fool Flow
// https://github.com/flowtype/flow-typed/issues/291
function mock(mockFn) {
  return ((mockFn: any): JestMockT);
}

export default class AsyncStorageMock {
  storageCache: Object;

  constructor(cache: Object = {}) {
    this.storageCache = cache;
  }

  setItem = mock(jest.fn((key, value) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.storageCache[key] = value;
        resolve(value);
      }, 20);
    });
  }));

  getItem = mock(jest.fn((key) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.storageCache[key]);
      }, 20);
    });
  }));

  removeItem = mock(jest.fn((key) => {
    return new Promise((resolve) => {
      delete this.storageCache[key];
      resolve(null);
    });
  }));

  clear = mock(jest.fn(() => {
    return new Promise((resolve) => {
      this.storageCache = {};
      resolve(null);
    });
  }));

  multiRemove = mock(jest.fn((keys, cb) => {
    return new Promise((resolve) => {
      this.storageCache = {};
      if (cb) cb(null);
      resolve(null);
    });
  }));

  getAllKeys = mock(jest.fn((cb) => {
    if (cb) {
      cb(null, Object.keys(this.storageCache));
    }
    return new Promise((resolve) => {
      resolve(Object.keys(this.storageCache));
    });
  }));

  multiSet = mock(jest.fn((items) => {
    return new Promise((resolve) => {
      items.forEach(([key, value]) => {
        this.storageCache[key] = value;
      });
      resolve(null);
    });
  }));

  multiGet = mock(jest.fn((keys) => {
    return new Promise((resolve) => {
      const res = Object.keys(this.storageCache)
        .filter(k => keys.includes(k))
        .map(k => [k, this.storageCache[k]]);
      resolve(res);
    });
  }));
}
