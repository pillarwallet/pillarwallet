// @flow
import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import { SDK_PROVIDER } from 'react-native-dotenv';

// temporary here
export default function SDKWrapper() {
  this.pillarSdk = null;
}

SDKWrapper.prototype.init = function (privateKey: string) {
  this.pillarSdk = new PillarSdk({
    privateKey: privateKey.slice(2),
    apiUrl: SDK_PROVIDER,
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string) {
  return this.pillarSdk.wallet.register({ fcmToken: fcm }).catch(() => ({}));
};

SDKWrapper.prototype.getInitialAssets = function (walletId: string) {
  return this.pillarSdk.asset.defaults({ walletId })
    .catch(() => [])
    .then(transformAssetsToObject);
};
