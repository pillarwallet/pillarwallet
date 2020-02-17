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
import { BN } from 'ethereumjs-util'; // same BigNumber library as in Archanova SDK
import { View as mockView } from 'react-native';
import { utils } from 'ethers';
import StorageMock from './asyncStorageMock';
import FirebaseMock from './firebaseMock';
import WalletConnectMock from './walletConnectMock';

require('stacktrace-parser');

process.env.IS_TEST = 'TEST';

jest.mock('NativeAnimatedHelper');

Enzyme.configure({ adapter: new Adapter() });
const storageCache = {};
const MockAsyncStorage = new StorageMock(storageCache);

jest.mock('@react-native-community/async-storage', () => MockAsyncStorage);
jest.setMock('AsyncStorage', MockAsyncStorage);
jest.setMock('@react-native-firebase/analytics', FirebaseMock.analytics);
jest.setMock('@react-native-firebase/crashlytics', FirebaseMock.crashlytics);
jest.setMock('@react-native-firebase/messaging', FirebaseMock.messaging);
jest.setMock('@react-native-firebase/iid', FirebaseMock.iid);
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

Object.defineProperty(mockWallet, 'RNencrypt', {
  value: () => Promise.resolve({ address: 'encry_pted' }),
});

const mockInjectedProvider = {
  getBalance: () => Promise.resolve(1), // dummy balance
};

jest.setMock('ethers', {
  ethers: {
    Wallet: {
      fromMnemonic: () => mockWallet,
      RNfromEncryptedJson: () => mockWallet,
    },
  },
  utils: {
    parseEther: x => x,
    bigNumberify: x => x,
    id: utils.id,
    getAddress: utils.getAddress,
    formatUnits: utils.formatUnits,
    parseUnits: utils.parseUnits,
    HDNode: utils.HDNode,
  },
  providers: {
    getDefaultProvider: () => mockInjectedProvider,
    InfuraProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    JsonRpcProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    EtherscanProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    FallbackProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
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
  CachedImage: jest.fn(),
});

jest.setMock('react-native-threads', {
  Thread: () => ({
    onmessage: () => Promise.resolve(),
    postMessage: () => Promise.resolve(),
  }),
});

const mockSmartWalletAccount = {
  id: 123,
  address: 'publicAddress',
  deployMode: 'Unsecured',
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
    event$: {
      subscribe: jest.fn(),
    },
    estimateAccountTransaction: () => Promise.resolve({
      gasFee: new BN(70000),
      signedGasPrice: { gasPrice: new BN(5000000000) },
    }),
  }),
});

jest.setMock('react-native-keychain', {
  setGenericPassword: () => {},
  getGenericPassword: () => {},
  resetGenericPassword: () => {},
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BIOMETRY_ANY',
  },
});

jest.setMock('@walletconnect/react-native', WalletConnectMock);

jest.setMock('services/insight', {
  getAddressUtxosFromNode: (address) => Promise.resolve([
    {
      address,
      txid: '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c9b',
      vout: 0,
      scriptPubKey: '76a9146d622b371423d2e450c19d98059867d71e6aa87c88ac',
      amount: 1.3,
      satoshis: 130000000,
      height: 1180957,
      confirmations: 14,
    },
  ]),
  getBTCTransactionsFromNode: (address) => Promise.resolve([
    {
      _id: '5bd0b60d19b81e4567d3a10d',
      chain: 'BTC',
      network: 'mainnet',
      coinbase: true,
      mintIndex: 0,
      spentTxid: '',
      mintTxid: '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c9b',
      mintHeight: 1,
      spentHeight: -2,
      address,
      script: 'xxx',
      value: 5000000000,
      confirmations: 6,
      details: {
        _id: '5ddcfa19b2cb5eecc49b5586',
        txid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
        network: 'testnet',
        chain: 'BTC',
        blockHeight: -1,
        blockHash: '',
        blockTime: '2019-11-26T10:10:33.958Z',
        blockTimeNormalized: '2019-11-26T10:10:33.958Z',
        coinbase: false,
        locktime: 1609854,
        inputCount: 1,
        outputCount: 2,
        size: 140,
        fee: 168,
        value: 4299832,
        confirmations: 0,
        coins: {
          inputs: [
            {
              _id: '5ddcf7b3b2cb5eecc4985995',
              chain: 'BTC',
              network: 'testnet',
              coinbase: false,
              mintIndex: 23,
              spentTxid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
              mintTxid: '01fed78bbf178ec4e7bd4ba399f49bc8c1f6ef12188f6bf367117f194e74942f',
              mintHeight: 1609853,
              spentHeight: -1,
              address: '2N9qAgGyvvSVJRGWvsseW13z9HuyvHnU3mo',
              script: 'a914b5ed644cb29594a1715de4efb7acb566e1e140dc87',
              value: 4300000,
              confirmations: -1,
              sequenceNumber: 4294967294,
            },
          ],
          outputs: [
            {
              _id: '5ddcfa19b2cb5eecc49b5566',
              chain: 'BTC',
              network: 'testnet',
              coinbase: false,
              mintIndex: 0,
              spentTxid: '',
              mintTxid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
              mintHeight: -1,
              spentHeight: -2,
              address: 'mi8YXVUVAQrSx2KCST62KcCAuwjv9b8n5G',
              script: '76a9141cab62a9afad8154fcb813fba486a4e1f845af3d88ac',
              value: 1000000,
              confirmations: -1,
            },
            {
              _id: '5ddcfa19b2cb5eecc49b5567',
              chain: 'BTC',
              network: 'testnet',
              coinbase: false,
              mintIndex: 1,
              spentTxid: '',
              mintTxid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
              mintHeight: -1,
              spentHeight: -2,
              address: '2N7TyRzRx1BxZ11igaKTF46HtKo2hFt6sJF',
              script: 'a9149bfb046026e40f95e528960aead3208ffdcbb18f87',
              value: 3299832,
              confirmations: -1,
            },
          ],
        },
      },
    },
  ]),
  getAddressBalanceFromNode: () => Promise.resolve({
    confirmed: 0,
    unconfirmed: 0,
    balance: 0,
  }),
  sendRawTransactionToNode: (raw) => raw.length < 50
    ? Promise.reject()
    : Promise.resolve({
      txid: '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c9b',
    }),
});

jest.setMock('react-native-appearance', {});

