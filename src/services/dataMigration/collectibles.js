// @flow
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { Collectibles, CollectiblesStore } from 'models/Collectible';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

const storage = Storage.getInstance('db');

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

export default async function (dispatch: Function) {
  const { accounts = [] } = await storage.get('accounts');
  const { collectibles = {} } = await storage.get('collectibles');

  if (Array.isArray(collectibles) && accounts.length) {
    const migratedCollectibles = migrateCollectiblesToAccountsFormat(collectibles, accounts);
    if (migratedCollectibles) {
      dispatch(saveDbAction('collectibles', { collectibles: migratedCollectibles }, true));
      return migratedCollectibles;
    }
  }
  return collectibles;
}
