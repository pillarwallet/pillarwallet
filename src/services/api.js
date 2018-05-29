// @flow
// remove from utils
import tokens from 'utils/erc_whitelist.json';
import { initialAssets } from 'fixtures/assets';

import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import { SDK_PROVIDER } from 'react-native-dotenv';

// temporary here
export default function SDKWrapper() {
  this.sdk = null;
}

SDKWrapper.prototype.init = function (privateKey: string) {
  this.sdk = new PillarSdk({
    privateKey: privateKey.slice(2),
    apiUrl: SDK_PROVIDER,
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string) {
  return this.sdk.wallet.register({ fcmToken: fcm }).catch(() => ({}));
};

SDKWrapper.prototype.getInitialAssets = function () {
  return Promise.resolve(initialAssets)
    .then(transformAssetsToObject);
};

SDKWrapper.prototype.getSupportedAsset = function () {
  return Promise.resolve(tokens);
};

