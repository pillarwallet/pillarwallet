// @flow
import { initialAssets } from 'fixtures/assets';
// remove from utils
import tokens from 'utils/erc_whitelist.json';

import { transformAssetsToObject } from 'utils/assets';

const pillarSdk = {
  registerOnBackend(privateKey: string) { // eslint-disable-line
    return Promise.resolve({});
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
