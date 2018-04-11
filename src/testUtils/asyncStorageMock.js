// @flow

import type { JestMockT } from 'jest';

// required to fool Flow
// https://github.com/flowtype/flow-typed/issues/291
function mock(mockFn) {
  return ((mockFn: any): JestMockT);
}

export default class AsyncStorageMock {
  storageCache: Object

  constructor(cache: Object = {}) {
    this.storageCache = cache;
  }

  setItem = mock(jest.fn((key, value) => {
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
      delete this.storageCache[key];
      resolve(null);
    });
  }));

  clear = mock(jest.fn((key) => {
    return new Promise((resolve, reject) => {
      this.storageCache = {};
      resolve(null);
    });
  }));

  getAllKeys = mock(jest.fn((key) => {
    return new Promise((resolve, reject) => resolve(Object.keys(this.storageCache)));
  }));

  multiSet = mock(jest.fn((items) => {
    return new Promise((resolve, reject) => {
      items.forEach(([key, value]) => {
        this.storageCache[key] = value;
      });
      resolve(null);
    });
  }));

  multiGet = mock(jest.fn(() => {
    return new Promise((resolve) => {
      resolve([]);
    });
  }));
}