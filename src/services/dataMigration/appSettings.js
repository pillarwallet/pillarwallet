// @flow
import { saveDbAction } from 'actions/dbActions';
import Storage from 'services/storage';
import { normalizeWalletAddress } from 'utils/wallet';

const storage = Storage.getInstance('db');

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

export default async function (dispatch: Function) {
  const { appSettings = {} } = await storage.get('app_settings');
  const { wallet } = await storage.get('wallet');

  if (appSettings.wallet && appSettings.lastTxSyncDatetime) {
    const migratedAppSettings = migrateAppSettingsToAccountsFormat(appSettings, normalizeWalletAddress(wallet.address));
    dispatch(saveDbAction('app_settings', { appSettings: migratedAppSettings }, true));
    return migratedAppSettings;
  }

  return appSettings;
}
