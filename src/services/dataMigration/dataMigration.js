// @flow
import loadAndMigrateAppSettings from './appSettings';
import loadAndMigrateAccounts from './accounts';
import loadAndMigrateBalances from './balances';
import loadAndMigrateHistory from './history';
import loadAndMigrateCollectibles from './collectibles';
import loadAndMigrateCollectiblesHistory from './collectiblesHistory';
import loadAndMigrateAssets from './assets';

export function loadAndMigrate(collection: string, dispatch: Function, getState: Function) {
  switch (collection) {
    case 'app_settings': return loadAndMigrateAppSettings(dispatch);
    case 'accounts': return loadAndMigrateAccounts(dispatch, getState);
    case 'balances': return loadAndMigrateBalances(dispatch);
    case 'history': return loadAndMigrateHistory(dispatch, getState);
    case 'collectibles': return loadAndMigrateCollectibles(dispatch);
    case 'collectiblesHistory': return loadAndMigrateCollectiblesHistory(dispatch);
    case 'assets': return loadAndMigrateAssets(dispatch);
    default: return null;
  }
}
