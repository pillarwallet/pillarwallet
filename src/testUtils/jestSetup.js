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
import jestSetup from 'react-native-gesture-handler/jestSetup';
import React from 'react';
import Enzyme from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { JSDOM } from 'jsdom';
import { BN } from 'ethereumjs-util'; // same BigNumber library as in Archanova SDK
import { View as mockView } from 'react-native';
import { utils, BigNumber as EthersBigNumber, constants as ethersConstants, Wallet as EthersWallet } from 'ethers';
import mocktract from 'mocktract';
import * as Etherspot from 'etherspot';
import { Animated } from 'react-native';
// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { ADDRESS_ZERO, ETH, PLR } from 'constants/assetsConstants';
import {
  EN_EXTERNAL_TEST_TRANSLATION,
  FR_EXTERNAL_TEST_TRANSLATION,
  TEST_TRANSLATIONS_BASE_URL,
  TEST_TRANSLATIONS_TIME_STAMP,
} from 'constants/localesConstants';
import { CHAIN } from 'constants/chainConstants';

// mocks
import StorageMock from './asyncStorageMock';
import WalletConnectMock from './walletConnectMock';
import envConfigMock from './envConfigMock';
import localeConfigMock from './localeConfigMock';

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
(console: any).error = (message) => {
  return message;
};

const storageCache = {};
const MockAsyncStorage = new StorageMock(storageCache);

jest.mock('@react-native-async-storage/async-storage', () => MockAsyncStorage);

jest.mock('react-native-safe-area-view', () => ({ children }) => <>{children}</>);

// Source: https://reactnavigation.org/docs/testing/#mocking-native-modules
// jest.mock('react-native-reanimated', () => {
//   // eslint-disable-next-line global-require
//   const Reanimated = require('react-native-reanimated/mock');

//   // Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
//   jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

//   // The mock for `call` immediately calls the callback which is incorrect
//   // So we override it with a no-op
//   Reanimated.default.call = () => {};

//   return Reanimated;
// });

jest.setMock('@react-native-firebase/app/lib/internal/registry/nativeModule', {});

jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: {
    delete: () => Promise.resolve(),
  },
}));

jest.mock('@react-native-firebase/analytics', () => () => ({
  logScreenView: () => jest.fn(),
  logEvent: () => jest.fn(),
  setUserProperties: () => jest.fn(),
}));

jest.mock('@react-native-firebase/crashlytics', () => () => ({
  setUserId: () => {},
}));

jest.mock('@react-native-firebase/messaging', () => () => ({
  registerDeviceForRemoteMessages: () => Promise.resolve(),
  requestPermission: () => Promise.resolve(),
  hasPermission: () => Promise.resolve(1),
  getToken: () => Promise.resolve('12x2342x212'),
}));

jest.mock('@react-native-firebase/remote-config', () => () => ({
  remoteConfig: () => Promise.resolve(),
  setDefaults: () => Promise.resolve(),
  fetch: () => Promise.resolve(),
  getAll: () => Promise.resolve({}),
  getBoolean: jest.fn(),
  getNumber: jest.fn().mockReturnValue(4),
}));

jest.setMock('react-native-splash-screen', {
  show: jest.fn(),
  hide: jest.fn(),
});

jest.setMock('react-native-shadow-2', { Shadow: () => '' });

jest.setMock('react-native-modal', () => 'react-native-modal');

jest.setMock('axios-mock-adapter');

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
    constants: ethersConstants,
  },
  Wallet: EthersWallet,
  Contract: mocktract,
  utils: {
    parseEther: (x) => x,
    id: utils.id,
    getAddress: utils.getAddress,
    formatUnits: utils.formatUnits,
    parseUnits: utils.parseUnits,
    HDNode: utils.HDNode,
    formatEther: utils.formatEther,
    randomBytes: utils.randomBytes,
    entropyToMnemonic: utils.entropyToMnemonic,
    isHexString: utils.isHexString,
    Interface: utils.Interface,
    SigningKey: utils.SigningKey,
  },
  providers: {
    getDefaultProvider: () => mockInjectedProvider,
    InfuraProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    JsonRpcProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    EtherscanProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    FallbackProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
  },
  constants: ethersConstants,
  BigNumber: EthersBigNumber,
});

jest.setMock('react-native-background-timer', {
  runBackgroundTimer: () => {},
  stopBackgroundTimer: () => {},
});

export const mockDeviceUniqueId = '1x1x1x1x1x1x1';

jest.setMock('react-native-device-info', {
  getUniqueId: () => mockDeviceUniqueId,
  getBuildNumber: () => '',
  getVersion: () => '',
});

const mockCameraView = mockView;

// ouch
// $FlowFixMe: react-native types
mockCameraView.Constants = {
  Type: {
    back: 'back',
  },
};

jest.mock('@react-native-cookies/cookies', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  getInitialURL: jest.fn(),
  get: () => Promise.resolve(null),
  clearAll: () => Promise.resolve(),
}));

jest.setMock('react-native-camera', {
  RNCamera: mockCameraView,
});

jest.setMock('react-native-vector-icons', {
  createIconSet: () => mockView,
});

export const mockPlrAddress = '0xe3818504c1b32bf1557b16c238b2e01fd3149c17';
export const mockEthAddress = ADDRESS_ZERO;

const mockTokensExchangeRates = {
  [mockPlrAddress]: {
    EUR: 1.21,
    GBP: 1.1,
    USD: 1.42,
  },
};

export const mockEtherExchangeRates = {
  EUR: 624.21,
  GBP: 544.57,
  USD: 748.92,
};

export const mockExchangeRates = {
  ...mockTokensExchangeRates,
  [mockEthAddress]: mockEtherExchangeRates,
};

jest.setMock('react-native-share', {});

jest.setMock('react-native-fast-image', () => null);

jest.setMock('@storybook/addon-storyshots', () => null);

jest.setMock('@walletconnect/utils', {});

jest.setMock('@walletconnect/core', {});

jest.setMock('@walletconnect/web3wallet', {});

export const mockArchanovaAccountApiData = {
  id: 123,
  address: '0x0',
  ensName: null,
  state: 'Created',
  nextState: null,
  updatedAt: '2019-05-10T07:15:09.000Z',
};

export const mockArchanovaAccount = {
  id: '0x0',
  isActive: false,
  type: ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET,
  extra: mockArchanovaAccountApiData,
};

export const mockArchanovaConnectedAccount = {
  ...mockArchanovaAccountApiData,
  activeDeviceAddress: '0x0',
  devices: [],
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
    Kovan: 'Kovan',
  },
  getSdkEnvironment: () => mockArchanovaSdkInstance,
  createSdk: () => ({
    initialize: () => Promise.resolve(),
    getConnectedAccounts: () => Promise.resolve({ items: [mockArchanovaAccountApiData] }),
    createAccount: () => Promise.resolve(mockArchanovaAccountApiData),
    connectAccount: () => Promise.resolve(mockArchanovaAccountApiData),
    event$: {
      subscribe: jest.fn(),
      next: jest.fn(),
    },
    estimateAccountTransaction: () =>
      Promise.resolve({
        gasFee: new BN(70000),
        signedGasPrice: { gasPrice: new BN(5000000000) },
      }),
    reset: () => Promise.resolve(),
    getConnectedAccountDevices: () => Promise.resolve([]),
    state: {
      account: mockArchanovaAccountApiData,
      accountDevice: { device: { address: '0x0' } },
    },
    getConnectedAccountPayments: () => Promise.resolve([]),
    getConnectedAccountTransactions: () => Promise.resolve([]),
  }),
});

jest.setMock('react-native-keychain', {
  setGenericPassword: jest.fn().mockResolvedValue(),
  getGenericPassword: jest.fn(
    () =>
      new Promise((resolve) =>
        resolve({
          pin: '123456',
          privateKey: 'testKey',
          mnemonic: { phrase: 'testMnemonic' },
        }),
      ),
  ),
  resetGenericPassword: jest.fn().mockResolvedValue(),
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BIOMETRY_ANY',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  },
});

jest.setMock('@walletconnect/client', WalletConnectMock);

jest.setMock('@sentry/react-native', {
  withScope: () => {},
  addBreadcrumb: () => {},
});

jest.setMock('react-native-notifications');

jest.setMock('@react-native-community/netinfo');

jest.setMock('rn-swipe-button');

jest.setMock('react-native-appearance', {});

jest.setMock('configs/envConfig', envConfigMock);

export const mockSupportedAssets = [
  {
    symbol: ETH,
    name: 'Ethereum',
    address: mockEthAddress,
    iconUrl: '',
    decimals: 18,
  },
  {
    symbol: PLR,
    name: 'Pillar',
    address: mockPlrAddress,
    iconUrl: '',
    decimals: 18,
  },
];

export const mockStableAssets = [
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chainId: 1,
    decimals: 6,
    logoURI: null,
    name: 'Tether',
    symbol: 'USDT',
  },
];

jest.setMock('configs/localeConfig', localeConfigMock);

jest.setMock('services/rates', {
  getExchangeTokenPrices: () => Promise.resolve(mockExchangeRates),
});

const getMockedTranslations = (url) => {
  switch (url) {
    case `${TEST_TRANSLATIONS_BASE_URL}fr/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`:
    case `${TEST_TRANSLATIONS_BASE_URL}fr/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`:
      return { test: FR_EXTERNAL_TEST_TRANSLATION };
    case `${TEST_TRANSLATIONS_BASE_URL}en/auth_${TEST_TRANSLATIONS_TIME_STAMP}.json`:
    case `${TEST_TRANSLATIONS_BASE_URL}en/common_${TEST_TRANSLATIONS_TIME_STAMP}.json`:
      return { test: EN_EXTERNAL_TEST_TRANSLATION, englishOnly: EN_EXTERNAL_TEST_TRANSLATION };
    default:
      return {};
  }
};

jest.setMock('utils/cache', {
  // getCachedJSONFile: (localPath) => Promise.resolve({ test: 'yaya' }),
  getCachedJSONFile: (localPath) => getMockedTranslations(localPath),
  getCachedTranslationResources: (translationsData) =>
    translationsData.reduce((formatted, { ns, url }) => {
      if (ns) formatted[ns] = getMockedTranslations(url);
      return formatted;
    }, {}),
});

export const mockEtherspotAccount = {
  id: '0x9e',
  isActive: false,
  type: ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
};

export const mockEtherspotApiAccount: Etherspot.Account = {
  address: '0x9e',
  type: Etherspot.AccountTypes.Contract,
  state: Etherspot.AccountStates.UnDeployed,
  store: Etherspot.AccountStores.PersonalAccountRegistry,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockEtherspotAccountExtra: Etherspot.Account = {
  ethereum: mockEtherspotApiAccount,
  xdai: null,
  binance: null,
  polygon: null,
};

jest.setMock('react-native-appsflyer', {});

const mockEtherspotGetBalances = (chain, address, assets) => {
  // mock positive balances
  const balances = assets.map(({ symbol, address: assetAddress }) => ({
    symbol,
    address: assetAddress,
    balance: 1,
  }));

  return Promise.resolve(balances);
};

jest.setMock('services/etherspot', {
  sdk: jest.fn(),
  init: jest.fn(),
  getAccounts: jest.fn(),
  getAccountPerChains: () => ({ ethereum: mockEtherspotApiAccount, xdai: null, binance: null, polygon: null }),
  getSupportedAssets: (chain) => Promise.resolve(chain === CHAIN.ETHEREUM ? mockSupportedAssets : []),
  getBalances: mockEtherspotGetBalances,
  getAccountTotalBalances: () => Promise.resolve(),
  getAccountInvestments: () => Promise.resolve(),
  getEnsNode: () => Promise.resolve(),
});
