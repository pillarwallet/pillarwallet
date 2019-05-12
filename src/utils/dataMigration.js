// @flow
import type { Balances, BalancesStore } from 'models/Asset';
import type { Account, Accounts } from 'models/Account';
import type { Transaction, TransactionsStore } from 'models/Transaction';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import type { CollectiblesHistoryStore, CollectiblesStore, Collectibles } from 'models/Collectible';

function findKeyBasedAccount(accounts: Accounts): ?Account {
  return accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
}

export function migrateBalancesToAccountsFormat(balances: Balances, accounts: Accounts): ?BalancesStore {
  const keyBasedAccount = findKeyBasedAccount(accounts);
  if (!keyBasedAccount) return null;

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: { ...balances },
  };
}

export function migrateTxHistoryToAccountsFormat(history: Transaction[], accounts: Accounts): ?TransactionsStore {
  const keyBasedAccount = findKeyBasedAccount(accounts);
  if (!keyBasedAccount) return null;

  const filteredHistory = history
    .filter(({ hash }) => !!hash)
    .filter(({ value }) => typeof value !== 'object');

  const accountId = keyBasedAccount.id;
  return {
    [accountId]: [...filteredHistory],
  };
}

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
