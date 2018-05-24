// @flow
import { initialAssets } from 'fixtures/assets';
// remove from utils
import tokens from 'utils/erc_whitelist.json';

import { transformAssetsToObject } from 'utils/assets';

const pillarSdk = {
  registerOnBackend(privateKey: string) { // eslint-disable-line
    return Promise.resolve({ id: 1 });
  },
  getInitialAssets() {
    return Promise.resolve(initialAssets);
  },
};

export function registerOnBackend(privateKey: string) {
  return pillarSdk.registerOnBackend(privateKey).catch(() => null);
}

export function getInitialAssets() {
  return pillarSdk.getInitialAssets()
    .catch(() => [])
    // .then(() => []) // remove this
    .then(transformAssetsToObject);
}

export function getSupportedAssets() {
  return Promise.resolve(tokens);
}


// temporary here
export default class PillarSdk {
  privateKey: string;

  init({ privateKey }: { privateKey: string }) {
    if (this.privateKey) return;
    this.privateKey = privateKey;
  }

  registerOnBackend() {
    return pillarSdk.registerOnBackend(this.privateKey).catch(() => null);
  }

  getInitialAssets() {
    return pillarSdk.getInitialAssets()
      .catch(() => [])
      // .then(() => []) // remove this
      .then(transformAssetsToObject);
  }

  getSupportedAssets() {
    return Promise.resolve(tokens);
  }
}
