// @flow
import { saveStorageAction } from 'actions/dbActions';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

import type { Dispatch } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import type { CollectiblesHistoryStore } from 'models/Collectible';

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

export default async function (
  appStorage: Storage,
  dispatch: Dispatch,
) {
  const { accounts = [] } = await appStorage.get('accounts');
  const { collectiblesHistory = {} } = await appStorage.get('collectiblesHistory');

  if (Array.isArray(collectiblesHistory) && accounts.length) {
    const migratedCollectiblesHistory = migrateCollectiblesHistoryToAccountsFormat(
      collectiblesHistory, accounts,
    );

    if (migratedCollectiblesHistory) {
      dispatch(saveStorageAction(appStorage, 'collectiblesHistory', {
        collectiblesHistory: migratedCollectiblesHistory,
      }, true));
    }
  }
}
