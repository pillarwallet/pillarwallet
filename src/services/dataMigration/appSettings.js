// @flow
import { saveStorageAction } from 'actions/dbActions';
import Storage from 'services/storage';
import { normalizeWalletAddress } from 'utils/wallet';

import type { Dispatch } from 'reducers/rootReducer';

const migrateFromV1 = async (
  storage: Storage,
  appSettings: Object,
  dispatch: Dispatch,
): Object => {
  const { wallet } = await storage.get('wallet');

  if (wallet && !wallet.address) {
    return appSettings;
  }

  const { lastTxSyncDatetime } = appSettings;
  const walletAddress = normalizeWalletAddress(wallet.address);

  const migratedAppSettings = {
    ...appSettings,
    lastTxSyncDatetimes: {
      [walletAddress]: lastTxSyncDatetime,
    },
  };
  delete migratedAppSettings.lastTxSyncDatetime;

  dispatch(saveStorageAction(storage, 'app_settings', {
    appSettings: migratedAppSettings,
  }, true));

  return migratedAppSettings;
};

const migrateFromV2 = async (
  appStorage: Storage,
  networkStorage: Storage,
  appSettings: Object,
  dispatch: Dispatch,
): Object => {
  dispatch(saveStorageAction(networkStorage, 'settings', {
    lastTxSyncDatetimes: appSettings.lastTxSyncDatetimes,
  }, true));

  delete appSettings.lastTxSyncDatetimes;
  return appSettings;
};

const migrateAppSettings = async (
  storage: Storage,
  networkStorage: Storage,
  dispatch: Dispatch,
): Object => {
  let { appSettings = {} } = await storage.get('app_settings');

  if (appSettings.wallet && appSettings.lastTxSyncDatetime) {
    appSettings = migrateFromV1(storage, appSettings, dispatch);
  }

  if (appSettings.lastTxSyncDatetimes) {
    migrateFromV2(storage, networkStorage, appSettings, dispatch);
  }

  return appSettings;
};

export default migrateAppSettings;
