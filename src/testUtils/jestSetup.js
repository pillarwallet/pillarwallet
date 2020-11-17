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

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { ETH, PLR } from 'constants/assetsConstants';
import {
  EN_EXTERNAL_TEST_TRANSLATION,
  FR_EXTERNAL_TEST_TRANSLATION,
  TEST_TRANSLATIONS_BASE_URL,
  TEST_TRANSLATIONS_TIME_STAMP,
} from 'constants/localesConstants';
import { PROVIDER_1INCH, PROVIDER_SYNTHETIX, PROVIDER_UNISWAP } from 'constants/exchangeConstants';

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
    iid: () => ({
      delete: () => Promise.resolve(),
    }),
    analytics: () => ({
      logEvent: () => {},
    }),
    crashlytics: () => ({
      setUserId: () => {
      },
    }),
    remoteConfig: () => ({
      remoteConfig: () => Promise.resolve(),
      setDefaults: () => Promise.resolve(),
      fetch: () => Promise.resolve(),
      getAll: () => Promise.resolve({}),
      getBoolean: jest.fn(),
    }),
    messaging: () => ({
      registerForRemoteNotifications: () => Promise.resolve(),
      requestPermission: () => Promise.resolve(),
      hasPermission: () => Promise.resolve(1),
      getToken: () => Promise.resolve('12x2342x212'),
    }),
  },
}));

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
    randomBytes: utils.randomBytes,
    entropyToMnemonic: utils.entropyToMnemonic,
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
  logout: jest.fn(),
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
  clearAll: () => Promise.resolve(),
}));

jest.setMock('react-native-camera', {
  RNCamera: mockCameraView,
});

jest.setMock('react-native-vector-icons', {
  createIconSet: () => mockView,
});

const mockTokensExchangeRates = {
  PLR: {
    EUR: 1.21,
    GBP: 1.10,
    USD: 1.42,
  },
};

const mockEtherExchangeRates = {
  EUR: 624.21,
  GBP: 544.57,
  USD: 748.92,
};

export const mockExchangeRates = {
  ...mockTokensExchangeRates,
  ETH: mockEtherExchangeRates,
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

export const mockSmartWalletAccountApiData = {
  id: 123,
  address: '0x0',
  ensName: null,
  state: 'Created',
  nextState: null,
  updatedAt: '2019-05-10T07:15:09.000Z',
};

export const mockSmartWalletAccount = {
  id: '0x0',
  isActive: false,
  walletId: '',
  type: ACCOUNT_TYPES.SMART_WALLET,
  extra: mockSmartWalletAccountApiData,
};

export const mockSmartWalletConnectedAccount = {
  ...mockSmartWalletAccountApiData,
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
    getConnectedAccounts: () => Promise.resolve({ items: [mockSmartWalletAccountApiData] }),
    createAccount: () => Promise.resolve(mockSmartWalletAccountApiData),
    connectAccount: () => Promise.resolve(mockSmartWalletAccountApiData),
    event$: {
      subscribe: jest.fn(),
      next: jest.fn(),
    },
    estimateAccountTransaction: () => Promise.resolve({
      gasFee: new BN(70000),
      signedGasPrice: { gasPrice: new BN(5000000000) },
    }),
    reset: () => Promise.resolve(),
    getConnectedAccountDevices: () => Promise.resolve([]),
    state: {
      account: mockSmartWalletAccountApiData,
      accountDevice: { device: { address: '0x0' } },
    },
    getConnectedAccountPayments: () => Promise.resolve([]),
    getConnectedAccountTransactions: () => Promise.resolve([]),
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

jest.setMock('configs/envConfig', envConfigMock);

export const mockSupportedAssets = [
  {
    symbol: ETH,
    name: 'ethereum',
    balance: 1,
    address: '',
    description: '',
    iconUrl: '',
    iconMonoUrl: '',
    wallpaperUrl: '',
    decimals: 18,
  },
  {
    symbol: PLR,
    name: 'ethereum',
    balance: 1,
    address: '',
    description: '',
    iconUrl: '',
    iconMonoUrl: '',
    wallpaperUrl: '',
    decimals: 18,
  },
];

export const mockUserBadges = [{
  badgeId: '5c9bda927d7363000673f08c',
  createdAt: 1553717906,
  description: 'Badge description',
  id: 1553717906,
  imageUrl: 'https://s3.eu-west-2.amazonaws.com/pillar-qa-badges-images-eu-west-2-861741397496/new-wallet_180%403x.png',
  name: 'To the Moon!',
  receivedAt: 1601876318,
  subtitle: 'Wallet created',
  updatedAt: 1553717968,
}];

jest.setMock('configs/localeConfig', localeConfigMock);

jest.setMock('services/coinGecko', {
  getCoinGeckoTokenPrices: () => Promise.resolve(mockTokensExchangeRates),
  getCoinGeckoEtherPrice: () => Promise.resolve(mockEtherExchangeRates),
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
  getCachedTranslationResources: (translationsData) => translationsData.reduce((formatted, { ns, url }) => {
    if (ns) formatted[ns] = getMockedTranslations(url);
    return formatted;
  }, {}),
});

jest.setMock('services/synthetix', {
  getSynthetixOffer: () => Promise.resolve({
    provider: PROVIDER_SYNTHETIX,
  }),
  createSynthetixOrder: () => Promise.resolve({}),
});

jest.setMock('services/uniswap', {
  getUniswapOffer: () => Promise.resolve({
    provider: PROVIDER_UNISWAP,
  }),
  createUniswapOrder: () => Promise.resolve({}),
  fetchUniswapSupportedTokens: jest.fn(),
});

jest.setMock('services/1inch', {
  get1inchOffer: () => Promise.resolve({
    provider: PROVIDER_1INCH,
  }),
  create1inchOrder: () => Promise.resolve({}),
  fetch1inchSupportedTokens: () => Promise.resolve([]),
});
