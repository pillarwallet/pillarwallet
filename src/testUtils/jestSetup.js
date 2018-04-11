// @flow
// This script runs at the beginning of all unit tests
import StorageMock from './asyncStorageMock';

const storageCache = {};
const AsyncStorage = new StorageMock(storageCache);

jest.setMock('AsyncStorage', AsyncStorage);
