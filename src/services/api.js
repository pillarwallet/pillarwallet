// @flow
import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import BCX from 'blockchain-explorer-sdk';
import {
  SDK_PROVIDER,
  BCX_URL,
  NOTIFICATIONS_URL,
} from 'react-native-dotenv'; // SDK_PROVIDER, ONLY if you have platform running locally
import type { Asset } from 'models/Asset';
import { uniqBy } from 'utils/common';
import type { Transaction } from 'models/Transaction';
import { fetchAssetBalances } from 'services/assets';
import { utils } from 'ethers';

type HistoryPayload = {
  address1: string,
  address2?: string,
  asset?: string,
  batchNb?: number,
};


type BalancePayload = {
  address: string,
  assets: Asset[],
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
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string, username: string) {
  return this.pillarWalletSdk.wallet.register({ fcmToken: fcm, username })
    .then(({ data }) => data)
    .catch(() => ({}));
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

SDKWrapper.prototype.userInfo = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.info({ walletId }))
    .then(({ data }) => ({ ...data, walletId }))
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

SDKWrapper.prototype.fetchNotifications = function (walletId: string, type: string) {
  // temporary here: fetch last 7 days
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.notification.list({
      walletId,
      fromTimestamp: d.toISOString(),
      type,
    }))
    .then(({ data }) => data)
    .then(({ notifications }) => notifications)
    .catch(() => []);
};

SDKWrapper.prototype.fetchHistory = function (payload: HistoryPayload) {
  return BCXSdk.txHistory(payload)
    .then(({ txHistory: { txHistory } }) => uniqBy(txHistory, 'hash'))
    .then(history => {
      return history.map(({
        fromAddress,
        toAddress,
        txHash,
        value,
        ...rest
      }): Transaction => ({
        to: toAddress,
        from: fromAddress,
        hash: txHash,
        value: utils.formatUnits(utils.bigNumberify(value.toString())),
        ...rest,
      }));
    })
    .catch(() => []);
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
