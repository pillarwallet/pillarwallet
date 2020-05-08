// @flow
import loadAndMigrateAppSettings from './appSettings';
import loadAndMigrateAccounts from './accounts';
import loadAndMigrateBalances from './balances';
import loadAndMigrateHistory from './history';
import loadAndMigrateCollectibles from './collectibles';
import loadAndMigrateCollectiblesHistory from './collectiblesHistory';
import loadAndMigrateAssets from './assets';

export function loadAndMigrate(collection: string, storageData: Object, dispatch: Function, getState: Function) {
  switch (collection) {
    case 'app_settings': return loadAndMigrateAppSettings(storageData, dispatch);
    case 'accounts': return loadAndMigrateAccounts(storageData, dispatch, getState);
    case 'balances': return loadAndMigrateBalances(storageData, dispatch);
    case 'history': return loadAndMigrateHistory(storageData, dispatch, getState);
    case 'collectibles': return loadAndMigrateCollectibles(storageData, dispatch);
    case 'collectiblesHistory': return loadAndMigrateCollectiblesHistory(storageData, dispatch);
    case 'assets': return loadAndMigrateAssets(storageData, dispatch);
    default: return null;
  }
}
