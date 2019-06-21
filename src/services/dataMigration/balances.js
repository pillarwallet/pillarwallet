// @flow
import { saveDbAction } from 'actions/dbActions';
import { ETH } from 'constants/assetsConstants';
import type { Balances, BalancesStore } from 'models/Asset';
import type { Accounts } from 'models/Account';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

const storage = Storage.getInstance('db');

export function migrateBalancesToAccountsFormat(balances: Balances, accounts: Accounts): ?BalancesStore {
  const keyBasedAccount = findKeyBasedAccount(accounts);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: { ...balances },
  };
}

export default async function (dispatch: Function) {
  const { accounts = [] } = await storage.get('accounts');
  const { balances = {} } = await storage.get('balances');

  if (balances[ETH] && accounts.length) {
    const migratedBalances = migrateBalancesToAccountsFormat(balances, accounts);
    if (migratedBalances) {
      dispatch(saveDbAction('balances', { balances: migratedBalances }, true));
      return migratedBalances;
    }
  }
  return balances;
}
