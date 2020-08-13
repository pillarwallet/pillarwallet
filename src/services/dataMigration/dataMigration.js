// @flow
import loadAndMigrateAppSettings from './appSettings';
import loadAndMigrateAccounts from './accounts';
import loadAndMigrateBalances from './balances';
import loadAndMigrateHistory from './history';
import loadAndMigrateCollectibles from './collectibles';
import loadAndMigrateCollectiblesHistory from './collectiblesHistory';
import loadAndMigrateAssets from './assets';

export async function migrate(collection: string, storageData: Object, dispatch: Function, getState: Function) {
  let key = collection;
  let data;

  switch (collection) {
    case 'app_settings':
      data = await loadAndMigrateAppSettings(storageData, dispatch);
      key = 'appSettings';
      break;

    case 'accounts':
      data = await loadAndMigrateAccounts(storageData, dispatch);
      break;

    case 'assets':
      data = loadAndMigrateAssets(storageData);
      break;

    case 'balances':
      data = loadAndMigrateBalances(storageData);
      break;

    case 'history':
      await loadAndMigrateHistory(storageData, dispatch, getState);
      return storageData;

    case 'collectibles':
      data = loadAndMigrateCollectibles(storageData);
      break;

    case 'collectiblesHistory':
      data = loadAndMigrateCollectiblesHistory(storageData);
      break;

    default: break;
  }

  return {
    ...storageData,
    [collection]: { [key]: data },
  };
}
