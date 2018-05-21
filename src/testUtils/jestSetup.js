// @flow
// This script runs at the beginning of all unit tests
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { initialAssets as mockInitialAssets } from 'fixtures/assets';
import { transformAssetsToObject } from 'utils/assets';
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

jest.setMock('services/api', {
  registerOnBackend(privateKey: string) { // eslint-disable-line
    return Promise.resolve({ id: 2 });
  },
  getInitialAssets() {
    return Promise.resolve(mockInitialAssets).then(transformAssetsToObject);
  },
});
