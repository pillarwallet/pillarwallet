// @flow
import { initialAssets } from 'fixtures/assets';
// remove from utils
import tokens from 'utils/erc_whitelist.json';

import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import { SDK_PROVIDER } from 'react-native-dotenv';

type Options = {
  privateKey: string,
}

// temporary here
export default function SDKWrapper() {
  this.sdk = null;
}

SDKWrapper.prototype.init = function (opts: Options) {
  this.sdk = new PillarSdk({
    privateKey: opts.privateKey.slice(2),
    apiUrl: SDK_PROVIDER,
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string) {
  return this.sdk.wallet.register({ fcmToken: fcm }).catch(() => ({}));
};

SDKWrapper.prototype.getInitialAssets = function () {
  return this.sdk.getInitialAssets()
    .catch(() => [])
    // .then(() => []) // remove this
    .then(transformAssetsToObject);
};

SDKWrapper.prototype.getSupportedAsset = function () {
  return Promise.resolve(tokens);
};

