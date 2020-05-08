// @flow
import get from 'lodash.get';
import { saveDbAction } from 'actions/dbActions';
import { normalizeWalletAddress } from 'utils/wallet';


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

export default async function (storageData: Object, dispatch: Function) {
  const { appSettings = {} } = get(storageData, 'app_settings', {});
  const { wallet = {} } = get(storageData, 'wallet', {});

  if (appSettings.wallet && appSettings.lastTxSyncDatetime && wallet.address) {
    const migratedAppSettings = migrateAppSettingsToAccountsFormat(appSettings, normalizeWalletAddress(wallet.address));
    dispatch(saveDbAction('app_settings', { appSettings: migratedAppSettings }, true));
    return migratedAppSettings;
  }

  return appSettings;
}
