// @flow
// This script runs at the beginning of all unit tests
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import StorageMock from './asyncStorageMock';
import FirebaseMock from './firebaseMock';

Enzyme.configure({ adapter: new Adapter() });

const storageCache = {};
const AsyncStorage = new StorageMock(storageCache);

jest.setMock('AsyncStorage', AsyncStorage);
jest.setMock('react-native-firebase', FirebaseMock);
jest.setMock('cryptocompare', {
  priceMulti: (tokensArray, priceMulti) => { // eslint-disable-line
    return Promise.resolve({});
  },
});
