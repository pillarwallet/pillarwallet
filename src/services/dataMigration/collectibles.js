// @flow
import get from 'lodash.get';
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { Collectibles, CollectiblesStore } from 'models/Collectible';
import { findKeyBasedAccount } from 'utils/accounts';


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

export default async function (storageData: Object, dispatch: Function) {
  const { accounts = [] } = get(storageData, 'accounts', {});
  const { collectibles = {} } = get(storageData, 'collectibles', {});

  if (Array.isArray(collectibles) && accounts.length) {
    const migratedCollectibles = migrateCollectiblesToAccountsFormat(collectibles, accounts);
    if (migratedCollectibles) {
      dispatch(saveDbAction('collectibles', { collectibles: migratedCollectibles }, true));
      return migratedCollectibles;
    }
  }
  return collectibles;
}
