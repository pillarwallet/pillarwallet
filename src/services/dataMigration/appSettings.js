// @flow
import { saveStorageAction } from 'actions/dbActions';
import Storage from 'services/storage';
import { normalizeWalletAddress } from 'utils/wallet';

import type { Dispatch } from 'reducers/rootReducer';

function migrateAppSettingsToAccountsFormat(appSettings: Object, walletAddress: string) {
  const { lastTxSyncDatetime } = appSettings;
  const migratedData = {
    ...appSettings,
    lastTxSyncDatetimes: {
      [walletAddress]: lastTxSyncDatetime,
    },
  };
  delete migratedData.lastTxSyncDatetime;
  return migratedData;
}

export default async function (
  appSettings: Object,
  wallet: Object,
  appStorage: Storage,
  dispatch: Dispatch,
) {
  if (appSettings.wallet && wallet.address) {
    const migratedAppSettings = migrateAppSettingsToAccountsFormat(
      appSettings,
      normalizeWalletAddress(wallet.address),
    );

    dispatch(saveStorageAction(appStorage, 'app_settings', {
      appSettings: migratedAppSettings,
    }, true));
  }
}
