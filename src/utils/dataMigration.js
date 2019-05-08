// @flow
import type { Balances } from 'models/Asset';
import type { Accounts } from 'models/Account';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

export function migrateBalancesToAccountsFormat(balances: Balances, accounts: Accounts) {
  const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: { ...balances },
  };
}
