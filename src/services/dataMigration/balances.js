// @flow
import get from 'lodash.get';
import { saveDbAction } from 'actions/dbActions';
import { ETH } from 'constants/assetsConstants';
import type { Balances, BalancesStore } from 'models/Asset';
import type { Accounts } from 'models/Account';
import { findKeyBasedAccount } from 'utils/accounts';


export function migrateBalancesToAccountsFormat(balances: Balances, accounts: Accounts): ?BalancesStore {
  const keyBasedAccount = findKeyBasedAccount(accounts);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: { ...balances },
  };
}

export default async function (storageData: Object, dispatch: Function) {
  const { accounts = [] } = get(storageData, 'accounts', {});
  const { balances = {} } = get(storageData, 'balances', {});

  if (balances[ETH] && accounts.length) {
    const migratedBalances = migrateBalancesToAccountsFormat(balances, accounts);
    if (migratedBalances) {
      dispatch(saveDbAction('balances', { balances: migratedBalances }, true));
      return migratedBalances;
    }
  }
  return balances;
}
