// @flow
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { CollectiblesHistoryStore } from 'models/Collectible';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

const storage = Storage.getInstance('db');

export function migrateCollectiblesHistoryToAccountsFormat(
  history: Object[],
  accounts: Accounts,
): ?CollectiblesHistoryStore {
  const keyBasedAccount = findKeyBasedAccount(accounts);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: [...history],
  };
}

export default async function (dispatch: Function) {
  const { accounts = [] } = await storage.get('accounts');
  const { collectiblesHistory = {} } = await storage.get('collectiblesHistory');

  if (Array.isArray(collectiblesHistory) && accounts.length) {
    const migratedCollectiblesHistory = migrateCollectiblesHistoryToAccountsFormat(collectiblesHistory, accounts);
    if (migratedCollectiblesHistory) {
      dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: migratedCollectiblesHistory }, true));
      return migratedCollectiblesHistory;
    }
  }
  return collectiblesHistory;
}
