// @flow
import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import BCX from 'blockchain-explorer-sdk';
import {
  SDK_PROVIDER,
  BCX_URL,
  NOTIFICATIONS_URL,
  INVESTMENTS_URL,
} from 'react-native-dotenv'; // SDK_PROVIDER, ONLY if you have platform running locally
import type { Asset } from 'models/Asset';
import type { Transaction } from 'models/Transaction';
import {
  fetchAssetBalances,
  fetchLastBlockNumber,
  fetchTransactionInfo,
  fetchTransactionReceipt,
} from 'services/assets';
import { USERNAME_EXISTS, REGISTRATION_FAILED } from 'constants/walletConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

// temporary here
import { icoFundingInstructions as icoFundingInstructionsFixtures } from 'fixtures/icos';

const USERNAME_EXISTS_ERROR_CODE = 409;

type HistoryPayload = {
  address1: string,
  address2?: string,
  asset?: string,
  nbTx?: number,
  fromIndex: number,
};

type BalancePayload = {
  address: string,
  assets: Asset[],
};

type UserInfoByIdPayload = {
  walletId: string,
  userAccessKey: string,
  targetUserAccessKey: string,
};

const BCXSdk = new BCX({ apiUrl: BCX_URL });

export default function SDKWrapper() {
  this.pillarWalletSdk = null;
}

SDKWrapper.prototype.init = function (privateKey: string) {
  this.pillarWalletSdk = new PillarSdk({
    privateKey: privateKey.slice(2),
    apiUrl: SDK_PROVIDER, // ONLY if you have platform running locally
    notificationsUrl: NOTIFICATIONS_URL,
    investmentsUrl: INVESTMENTS_URL,
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string, username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.wallet.register({ fcmToken: fcm, username }))
    .then(({ data }) => data)
    .catch((e = {}) => {
      if (e.response && e.response.status === USERNAME_EXISTS_ERROR_CODE) {
        return {
          error: true,
          reason: USERNAME_EXISTS,
        };
      }
      return {
        error: true,
        reason: REGISTRATION_FAILED,
      };
    });
};

SDKWrapper.prototype.fetchInitialAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.defaults({ walletId }))
    .then(({ data }) => data)
    .catch(() => [])
    .then(transformAssetsToObject);
};


SDKWrapper.prototype.updateUser = function (user: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.update(user))
    .then(({ data }) => ({ ...data.user, walletId: user.walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.updateUserAvatar = function (walletId: string, formData: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.uploadProfileImageFormData(walletId, formData))
    .then(({ data }) => ({ profileImage: data.profileImage, walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.getUserAvatar = function (userId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.imageByUserId(userId))
    .catch(() => null);
};

SDKWrapper.prototype.userInfo = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.info({ walletId }))
    .then(({ data }) => ({ ...data, walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.userInfoById = function (targetUserId: string, params: UserInfoByIdPayload) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.infoById(targetUserId, params))
    .then(({ data }) => ({ ...data }))
    .catch(() => ({}));
};

SDKWrapper.prototype.userSearch = function (query: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.search({ query, walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.usernameSearch = function (username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.usernameSearch({ username }))
    .then(({ data }) => data)
    .catch(() => ({}));
  // TODO: handle 404 and other errors in different ways (e.response.status === 404)
};

SDKWrapper.prototype.validateAddress = function (blockchainAddress: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.validate({ blockchainAddress }))
    .then(({ data }) => data)
    .catch(() => ({}));
};

SDKWrapper.prototype.fetchSupportedAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.list({ walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.assetsSearch = function (query: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.search({ query, walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.fetchNotifications = function (walletId: string, type: string, fromTimestamp?: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.notification.list({
      walletId,
      fromTimestamp,
      type,
    }))
    .then(({ data }) => data)
    .then(({ notifications }) => notifications)
    .then(notifications => {
      return notifications.map(notification => {
        if (notification.type !== TRANSACTION_EVENT) return notification;

        const {
          type: notificationType,
          payload: {
            fromAddress,
            toAddress,
            txHash,
            ...restPayload
          },
          ...rest
        } = notification;

        return {
          type: notificationType,
          payload: {
            to: toAddress,
            from: fromAddress,
            hash: txHash,
            ...restPayload,
          },
          ...rest,
        };
      });
    })
    .catch(() => []);
};

SDKWrapper.prototype.fetchICOs = function (userId: string) { //eslint-disable-line
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.investments.icoList({ userId }))
    .then(({ data }) => data.data)
    .catch(() => []);
};

SDKWrapper.prototype.fetchICOFundingInstructions = function (walletId, currency) {
  const cryptos = ['ETH', 'BTC', 'LTC']; // mock purposes;
  const fixtures = {
    ...icoFundingInstructionsFixtures,
    currency,
    paymentType: cryptos.includes(currency) ? 'crypto_currency' : 'bank_transfer',
  };
  return Promise.resolve(fixtures);
};

SDKWrapper.prototype.fetchHistory = function (payload: HistoryPayload) {
  return BCXSdk.txHistory(payload)
    .then(({ txHistory: { txHistory } }) => txHistory)
    .then(history => {
      return history.map(({
        fromAddress,
        toAddress,
        txHash,
        timestamp,
        ...rest
      }): Transaction => ({
        to: toAddress,
        from: fromAddress,
        hash: txHash,
        createdAt: timestamp,
        ...rest,
      }));
    })
    .catch(() => []);
};

SDKWrapper.prototype.fetchGasInfo = function () {
  return fetch('https://www.etherchain.org/api/gasPriceOracle')
    .then(data => data.json())
    .then(data => ({
      min: data.safeLow,
      avg: data.standard,
      max: data.fast,
    }))
    .catch(() => ({}));
  // return BCXSdk.gasInfo({ nBlocks: 10 })
  //   .then(({ gasUsed }) => gasUsed)
  //   .catch(() => ({}));
};

SDKWrapper.prototype.fetchTxInfo = function (hash: string) {
  return fetchTransactionInfo(hash);
};

SDKWrapper.prototype.fetchTransactionReceipt = function (hash: string) {
  return fetchTransactionReceipt(hash);
};

SDKWrapper.prototype.fetchLastBlockNumber = function () {
  return fetchLastBlockNumber();
};

SDKWrapper.prototype.fetchBalances = function ({ address, assets }: BalancePayload) {
  // TEMPORARY FETCH FROM BLOCKCHAIN DIRECTLY
  return fetchAssetBalances(assets, address);
  // const promises = assets.map(async ({ symbol, address: contractAddress }) => {
  //   const payload = { contractAddress, address, asset: symbol };
  //   const { balance: response } = await BCXSdk.getBalance(payload);
  //   return { balance: response.balance, symbol: response.ticker };
  // });
  // return Promise.all(promises).catch(() => []);
};

SDKWrapper.prototype.sendInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.invite({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.cancelInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.cancel({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.acceptInvitation = function (
  targetUserId: string,
  targetUserAccessKey: string,
  accessKey: string,
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.accept({
      sourceUserAccessKey: accessKey,
      targetUserId,
      targetUserAccessKey,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.rejectInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.reject({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};
