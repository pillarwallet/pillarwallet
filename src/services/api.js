// @flow
import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import { SDK_PROVIDER } from 'react-native-dotenv';

// temporary here
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
  return this.pillarWalletSdk.wallet.register({ fcmToken: fcm }).catch(() => ({}));
};

SDKWrapper.prototype.getInitialAssets = function (walletId: string) {
  return this.pillarWalletSdk.asset.defaults({ walletId })
    .catch(() => [])
    .then(transformAssetsToObject);
};
