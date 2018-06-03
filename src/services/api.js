// @flow
import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import BCX from 'blockchain-explorer-sdk';
import { SDK_PROVIDER } from 'react-native-dotenv';
import type { Asset } from 'models/Asset';
import { initialAssets } from 'fixtures/assets'; // MUST BE REMOVED ONCE EVERYONE HAVE A SETUP PLATFORM

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
    apiUrl: SDK_PROVIDER,
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string) {
  return this.pillarWalletSdk.wallet.register({ fcmToken: fcm })
    .catch(() => ({}))
    .then(() => ({
      walletId: '123-123-123',
      userId: '321-321-321',
    })); // MUST BE REMOVED ONCE EVERYONE HAVE A SETUP PLATFORM
};

SDKWrapper.prototype.getInitialAssets = function (walletId: string) {
  // Promise.resolve is temporary here, if schema validation fails
  // the error is getting thrown outside the promise scope
  return Promise.resolve(() => this.pillarWalletSdk.asset.defaults({ walletId }))
    .catch(() => [])
    .then(() => initialAssets) // MUST BE REMOVED ONCE EVERYONE HAVE A SETUP PLATFORM
    .then(transformAssetsToObject);
};


SDKWrapper.prototype.updateUser = function (user: Object) {
  return Promise.resolve(() => this.pillarWalletSdk.user.update(user))
    .catch(() => ({}))
    .then(() => user); // MUST BE REMOVED ONCE EVERYONE HAVE A SETUP PLATFORM
};


SDKWrapper.prototype.fetchHistory = function (payload: HistoryPayload) {
  return BCX.txHistory(payload).then(({ txHistory: { txHistory } }) => txHistory);
};

SDKWrapper.prototype.fetchBalances = function ({ address, assets }: BalancePayload) {
  const promises = assets.map(({ symbol }) => BCX.getBalance({ address, asset: symbol }));
  return Promise.all(promises).then(transformAssetsToObject).catch(() => []);
};
