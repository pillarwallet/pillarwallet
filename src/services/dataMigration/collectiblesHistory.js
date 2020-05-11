// @flow
import get from 'lodash.get';
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { CollectiblesHistoryStore } from 'models/Collectible';
import { findKeyBasedAccount } from 'utils/accounts';


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

export default async function (storageData: Object, dispatch: Function) {
  const { accounts = [] } = get(storageData, 'accounts', {});
  const { collectiblesHistory = {} } = get(storageData, 'collectiblesHistory', {});

  if (Array.isArray(collectiblesHistory) && accounts.length) {
    const migratedCollectiblesHistory = migrateCollectiblesHistoryToAccountsFormat(collectiblesHistory, accounts);
    if (migratedCollectiblesHistory) {
      dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: migratedCollectiblesHistory }, true));
      return migratedCollectiblesHistory;
    }
  }
  return collectiblesHistory;
}
