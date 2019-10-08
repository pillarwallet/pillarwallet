// @flow
import { saveStorageAction } from 'actions/dbActions';
import { ETH } from 'constants/assetsConstants';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

import type { Balances, BalancesStore } from 'models/Asset';
import type { Accounts } from 'models/Account';
import type { Dispatch } from 'reducers/rootReducer';

export function migrateBalancesToAccountsFormat(balances: Balances, accounts: Accounts): ?BalancesStore {
  const keyBasedAccount = findKeyBasedAccount(accounts);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: { ...balances },
  };
}

export default async function (
  appStorage: Storage,
  dispatch: Dispatch,
) {
  const { accounts = [] } = await appStorage.get('accounts');
  const { balances = {} } = await appStorage.get('balances');

  if (balances[ETH] && accounts.length) {
    const migratedBalances = migrateBalancesToAccountsFormat(balances, accounts);
    if (migratedBalances) {
      dispatch(saveStorageAction(appStorage, 'balances', { balances: migratedBalances }, true));
    }
  }
}
