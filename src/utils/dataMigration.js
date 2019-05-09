// @flow
import type { Balances, BalancesStore } from 'models/Asset';
import type { Accounts } from 'models/Account';
import type { Transaction, TransactionsStore } from 'models/Transaction';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

export function migrateBalancesToAccountsFormat(balances: Balances, accounts: Accounts): ?BalancesStore {
  const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: { ...balances },
  };
}

export function migrateTxHistoryToAccountsFormat(history: Transaction[], accounts: Accounts): ?TransactionsStore {
  const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
  if (!keyBasedAccount) return null;

  const filteredHistory = history
    .filter(({ hash }) => !!hash)
    .filter(({ value }) => typeof value !== 'object');

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: [...filteredHistory],
  };
}
