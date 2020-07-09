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
// This script runs at the beginning of all unit tests
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { JSDOM } from 'jsdom';
import { BN } from 'ethereumjs-util'; // same BigNumber library as in Archanova SDK
import { View as mockView } from 'react-native';
import { utils } from 'ethers';
import mocktract from 'mocktract';
import StorageMock from './asyncStorageMock';
import WalletConnectMock from './walletConnectMock';

process.env.IS_TEST = 'TEST';

/**
 * Set up DOM in node.js environment for Enzyme to mount to
 */

const jsdom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
const { window } = jsdom;

function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target),
  });
}

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js',
};

copyProps(window, global);

Enzyme.configure({ adapter: new Adapter() });

// Ignore React Web errors when using React Native
(console: any).error = message => {
  return message;
};

const storageCache = {};
const MockAsyncStorage = new StorageMock(storageCache);

jest.mock('@react-native-community/async-storage', () => MockAsyncStorage);

jest.setMock('@react-native-firebase/crashlytics');
jest.setMock('@react-native-firebase/app/lib/internal/registry/nativeModule', {});

jest.mock('@react-native-firebase/app', () => ({
  firebase: {
    iid: () => {},
    analytics: () => ({
      logEvent: () => {},
    }),
    crashlytics: () => ({
      setUserId: () => {
      },
    }),
    messaging: () => ({
      registerForRemoteNotifications: () => Promise.resolve(),
      requestPermission: () => Promise.resolve(),
      hasPermission: () => Promise.resolve(1),
      getToken: () => Promise.resolve('12x2342x212'),
    }),
  },
}));

jest.setMock('cryptocompare', {
  priceMulti: (tokensArray, priceMulti) => { // eslint-disable-line
    return Promise.resolve({});
  },
});

jest.setMock('react-native-splash-screen', {
  show: jest.fn(),
  hide: jest.fn(),
});

jest.setMock('react-native-scrypt', () => Promise.resolve('xxxx'));

jest.setMock('react-native-permissions', {
  request: () => Promise.resolve('AUTHORIZED'),
});

const mockWallet: Object = {
  address: '0x9c',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
  connect: () => mockWallet,
};

Object.defineProperty(mockWallet, 'encrypt', {
  value: () => Promise.resolve({ address: 'encry_pted' }),
});

const mockInjectedProvider = {
  getBalance: () => Promise.resolve(1), // dummy balance
};

jest.setMock('ethers', {
  ethers: {
    Wallet: {
      fromMnemonic: () => mockWallet,
      fromEncryptedJson: () => mockWallet,
    },
  },
  Contract: mocktract,
  utils: {
    parseEther: x => x,
    id: utils.id,
    getAddress: utils.getAddress,
    formatUnits: utils.formatUnits,
    parseUnits: utils.parseUnits,
    HDNode: utils.HDNode,
    formatEther: utils.formatEther,
  },
  providers: {
    getDefaultProvider: () => mockInjectedProvider,
    InfuraProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    JsonRpcProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    EtherscanProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    FallbackProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
  },
  BigNumber: {
    from: x => x,
  },
});

jest.setMock('react-native-background-timer', {
  runBackgroundTimer: () => {},
  stopBackgroundTimer: () => {},
});

jest.setMock('react-native-device-info', {
  getUniqueId: () => '1x1x1x1x1x1x1',
});

jest.setMock('react-native-intercom', {
  addListener: () => { },
  removeListener: () => { },
  registerIdentifiedUser: () => { },
  Notifications: { UNREAD_COUNT: 'UNREAD_COUNT' },
  reset: () => { },
  setInAppMessageVisibility: () => { },
  sendTokenToIntercom: () => Promise.resolve(),
});

jest.setMock('rn-signal-protocol-messaging', {
  SignalClient: {
    getExistingMessages: () => Promise.resolve(),
    createClient: () => Promise.resolve(),
    init: () => Promise.resolve(),
    sendMessageByContact: () => Promise.resolve(),
    sendSilentMessageByContact: () => Promise.resolve(),
    receiveNewMessagesByContact: () => Promise.resolve(),
    registerAccount: () => Promise.resolve(),
    setFcmId: () => Promise.resolve(),
  },
});

const mockCameraView = mockView;

// ouch
mockCameraView.Constants = {
  Type: {
    back: 'back',
  },
};

jest.mock('react-native-cookies', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  getInitialURL: jest.fn(),
  get: () => Promise.resolve(null),
}));

jest.setMock('react-native-camera', {
  RNCamera: mockCameraView,
});

jest.setMock('react-native-vector-icons', {
  createIconSet: () => mockView,
});


function BCXSDK() {
  return {
    txHistory: () => Promise.resolve({ txHistory: { txHistory: [] } }),
    getBalance: () => Promise.resolve({ balance: { ticker: 'ETH', balance: 1 } }),
  };
}

jest.setMock('blockchain-explorer-sdk', BCXSDK);

const mockExchangeRates = {
  ETH: {
    EUR: 624.21,
    GBP: 544.57,
    USD: 748.92,
  },
};

jest.setMock('cryptocompare', {
  priceMulti: () => Promise.resolve(mockExchangeRates),
});

jest.setMock('react-native-share', {});

jest.setMock('react-native-cached-image', {
  ImageCacheManager: () => ({
    clearCache: () => Promise.resolve(),
  }),
  CachedImage: () => null,
});

const mockSmartWalletAccount = {
  id: 123,
  address: 'publicAddress',
  ensName: null,
  state: 'Created',
  nextState: null,
  updatedAt: '2019-05-10T07:15:09.000Z',
};

const mockArchanovaSdkInstance = {
  setConfig: () => mockArchanovaSdkInstance,
  extendConfig: () => mockArchanovaSdkInstance,
};

jest.setMock('@smartwallet/sdk', {
  sdkConstants: {
    AccountStates: {
      Created: 'Created',
      Updated: 'Updated',
    },
    GasPriceStrategies: {
      Avg: 'Avg',
      Fast: 'Fast',
    },
  },
  sdkModules: {
    Device: {
      StorageKeys: {
        PrivateKey: 'PrivateKey',
      },
    },
  },
  Sdk: {
    StorageNamespaces: {
      Device: 'Device',
    },
  },
  SdkEnvironmentNames: {
    Rinkeby: 'Rinkeby',
    Ropsten: 'Ropsten',
  },
  getSdkEnvironment: () => mockArchanovaSdkInstance,
  createSdk: () => ({
    initialize: () => Promise.resolve(),
    getConnectedAccounts: () => Promise.resolve({ items: [mockSmartWalletAccount] }),
    createAccount: () => Promise.resolve(mockSmartWalletAccount),
    connectAccount: () => Promise.resolve(),
    event$: {
      subscribe: jest.fn(),
      next: jest.fn(),
    },
    estimateAccountTransaction: () => Promise.resolve({
      gasFee: new BN(70000),
      signedGasPrice: { gasPrice: new BN(5000000000) },
    }),
    reset: () => Promise.resolve(),
  }),
});

jest.setMock('react-native-keychain', {
  setGenericPassword: jest.fn().mockResolvedValue(),
  getGenericPassword: jest.fn(() => new Promise((resolve) => resolve({
    pin: '123456', privateKey: 'testKey', mnemonic: { phrase: 'testMnemonic' },
  }))),
  resetGenericPassword: jest.fn().mockResolvedValue(),
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BIOMETRY_ANY',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  },
});

jest.setMock('@walletconnect/react-native', WalletConnectMock);

jest.mock('react-native-branch', () => jest.fn());

jest.setMock('@sentry/react-native', {
  withScope: () => {},
  Severity: {},
});

jest.setMock('react-native-notifications');

jest.setMock('@react-native-community/netinfo');

jest.setMock('react-native-appearance', {});
