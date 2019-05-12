// @flow
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { Transaction, TransactionsStore } from 'models/Transaction';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

const storage = Storage.getInstance('db');

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

export default async function (dispatch: Function) {
  const { accounts = [] } = await storage.get('accounts');
  const { history = {} } = await storage.get('history');

  if (Array.isArray(history) && accounts.length) {
    const migratedHistory = migrateTxHistoryToAccountsFormat(history, accounts);
    if (migratedHistory) {
      dispatch(saveDbAction('history', { history: migratedHistory }, true));
      return migratedHistory;
    }
  }
  return history;
}
