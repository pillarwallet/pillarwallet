// @flow
import { saveStorageAction } from 'actions/dbActions';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

import type { Accounts } from 'models/Account';
import type { Collectibles, CollectiblesStore } from 'models/Collectible';
import type { Dispatch } from 'reducers/rootReducer';

export function migrateCollectiblesToAccountsFormat(
  collectibles: Collectibles,
  accounts: Accounts,
): ?CollectiblesStore {
  const keyBasedAccount = findKeyBasedAccount(accounts);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: [...collectibles],
  };
}

export default async function (
  appStorage: Storage,
  dispatch: Dispatch,
) {
  const { accounts = [] } = await appStorage.get('accounts');
  const { collectibles = {} } = await appStorage.get('collectibles');

  if (Array.isArray(collectibles) && accounts.length) {
    const migratedCollectibles = migrateCollectiblesToAccountsFormat(collectibles, accounts);
    if (migratedCollectibles) {
      dispatch(saveStorageAction(appStorage, 'collectibles', {
        collectibles: migratedCollectibles,
      }, true));
    }
  }
}
