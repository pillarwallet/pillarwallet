// @flow
import SDKWrapper from 'services/api';
import { USERNAME_EXISTS, REGISTRATION_FAILED, UNREGISTRATION_FAILED } from 'constants/walletConstants';

const sdkWrapper = new SDKWrapper();

const mockWallet: Object = {
  address: '0x9c',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
};

const mockResponseSuccess: Object = {
  data: {
    accessToken: 'accessTokenValue',
    refreshToken: '55658b421ae515c2456aa2bcb1251787756e043d',
    refreshTokenExpiresAt: '2020-12-05T12:58:02.904Z',
    accessTokenExpiresAt: '2018-12-06T14:58:02.904Z',
    fcmToken: 'uniqueFCMToken',
    userId: '7d35d0c2-6ae8-4f05-9867-4b937e4e86d3',
    walletId: '18ebf932-adb5-4b48-9711-ed8101d25670',
  },
  status: 200,
};

const mockErrorDuplicate: Object = {
  response: {
    data: {
      error: 'Conflict',
      message: 'A valid nonce exists for this registration',
      statusCode: 409,
    },
    status: 409,
  },
};

const mockGeneralFailure: Object = {};

const unregisterMockSuccess = {
  data: {
    result: 'success',
    message: 'Successfully unregistered address on BCX',
  },
};

const unregisterMockFailure = {
  response: {
    data: {
      error: true,
      reason: UNREGISTRATION_FAILED,
    },
  },
};

type WalletRegisterAuth = {
  privateKey: string,
  username: string,
  fcmToken: string,
}

const registerAuthServerMock = jest.fn((walletRegisterAuth: WalletRegisterAuth) => {
  return new Promise((resolve, reject) => {
    if (walletRegisterAuth.privateKey.length > 0 && walletRegisterAuth.username.length > 0) {
      if (walletRegisterAuth && walletRegisterAuth.username.startsWith('unique')) {
        resolve(mockResponseSuccess);
      } else if (walletRegisterAuth && walletRegisterAuth.username.startsWith('duplicate')) {
        reject(mockErrorDuplicate);
      } else {
        reject(mockGeneralFailure);
      }
    } else {
      reject(mockGeneralFailure);
    }
  });
});

type WalletUnRegister = {
  walletId: string,
  blockchainAddress: ?string,
  blockchain: string,
}

const unregisterWalletMock = jest.fn((walletUnregister: WalletUnRegister) => {
  const { walletId, blockchainAddress } = walletUnregister;
  return new Promise((resolve, reject) => {
    if (walletId && blockchainAddress) {
      resolve(unregisterMockSuccess);
    } else {
      reject(unregisterMockFailure);
    }
  });
});

const mockPillarSDK: Object = {
  wallet: {
    registerAuthServer: registerAuthServerMock,
    unregisterAddress: unregisterWalletMock,
  },
};

describe('API service', () => {
  beforeEach(() => {
    sdkWrapper.init(mockWallet.privateKey);
    sdkWrapper.pillarWalletSdk = mockPillarSDK;
  });

  it('Should successfully register an account with the given username and fcm token and return userId', async () => {
    const result = await sdkWrapper.registerOnAuthServer('uniqueFCMToken', 'uniqueUsernameString');
    expect(result).toBe(mockResponseSuccess.data);
  });

  it('Should fail to register an account with a duplicate username and return USERNAME_EXISTS reason', async () => {
    const result = await sdkWrapper.registerOnAuthServer('anyFCMToken', 'duplicateUsernameString');
    expect(result).toEqual({
      error: true,
      reason: USERNAME_EXISTS,
    });
  });

  it('Should fail to register an account with empty parameters and return REGISTRATION_FAILED reason', async () => {
    const result = await sdkWrapper.registerOnAuthServer('', '');
    expect(result).toEqual({
      error: true,
      reason: REGISTRATION_FAILED,
    });
  });

  it('Should succesfully unregister wallet', async () => {
    const { address } = mockWallet;
    const result = await sdkWrapper.unregisterWallet(mockResponseSuccess.data.walletId, address);
    expect(result).toBe(unregisterMockSuccess.data);
  });

  it('Should fail to unregister wallet if walletId is empty', async () => {
    const { address } = mockWallet;
    const result = await sdkWrapper.unregisterWallet('', address);
    expect(result).toEqual({
      error: true,
      reason: UNREGISTRATION_FAILED,
    });
  });

  it('Should fail to unregister wallet if blockchainAddress is empty', async () => {
    const result = await sdkWrapper.unregisterWallet('some wallet id', '');
    expect(result).toEqual({
      error: true,
      reason: UNREGISTRATION_FAILED,
    });
  });
});
