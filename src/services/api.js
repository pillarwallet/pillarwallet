// @flow
import { initialAssets } from 'fixtures/assets';
import { transformAssetsToObject } from 'utils/assets';

const pillarSdk = {
  registerOnBackend(privateKey: string) {
    return Promise.reject();
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
    .then(() => []) // remove this
    .then(transformAssetsToObject);
}
