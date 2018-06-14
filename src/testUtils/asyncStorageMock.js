// @flow

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
      this.storageCache[key] = value;
      resolve(value);
    });
  }));

  getItem = mock(jest.fn((key) => {
    return new Promise((resolve) => {
      resolve(this.storageCache[key]);
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

  getAllKeys = mock(jest.fn((cb) => {
    cb(null, Object.keys(this.storageCache));
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
