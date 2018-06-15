// @flow
import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import BCX from 'blockchain-explorer-sdk';
import { SDK_PROVIDER } from 'react-native-dotenv'; // SDK_PROVIDER, ONLY if you have platform running locally
import type { Asset } from 'models/Asset';

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

export default function SDKWrapper() {
  this.pillarWalletSdk = null;
}

SDKWrapper.prototype.init = function (privateKey: string) {
  this.pillarWalletSdk = new PillarSdk({
    privateKey: privateKey.slice(2),
    apiUrl: SDK_PROVIDER, // ONLY if you have platform running locally
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string) {
  return this.pillarWalletSdk.wallet.register({ fcmToken: fcm })
    .then(({ data }) => data)
    .catch(() => ({}));
};

SDKWrapper.prototype.fetchInitialAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.defaults({ walletId }))
    .then(({ data }) => data)
    .then(transformAssetsToObject);
};


SDKWrapper.prototype.updateUser = function (user: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.update(user))
    .then(({ data }) => ({ ...data.user, walletId: user.walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.fetchSupportedAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.list({ walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.fetchHistory = function (payload: HistoryPayload) {
  return BCX.txHistory(payload)
    .then(({ txHistory: { txHistory } }) => txHistory)
    .catch(() => []);
};

SDKWrapper.prototype.fetchBalances = function ({ address, assets }: BalancePayload) {
  const promises = assets.map(async ({ symbol, address: contractAddress }) => {
    const payload = { contractAddress, address, asset: symbol };
    const { balance: response } = await BCX.getBalance(payload);
    return { balance: response.balance, symbol: response.ticker };
  });
  return Promise.all(promises).catch(() => []);
};
