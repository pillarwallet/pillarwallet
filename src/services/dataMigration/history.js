// @flow
// import { Sentry } from 'react-native-sentry';
import isEmpty from 'lodash.isempty';
import { saveStorageAction } from 'actions/dbActions';
import { SET_HISTORY } from 'constants/historyConstants';
import Storage from 'services/storage';
import {
  checkIfSmartWalletAccount,
  findKeyBasedAccount,
  getActiveAccount,
  getActiveAccountAddress,
  getActiveAccountId,
} from 'utils/accounts';
import { addressesEqual } from 'utils/assets';
import { updateAccountHistory } from 'utils/history';

import type {
  Dispatch,
  // GetState,
} from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import type { Transaction, TransactionsStore } from 'models/Transaction';

export function migrateTxHistoryToAccountsFormat(
  history: Transaction[],
  accounts: Accounts,
): ?TransactionsStore {
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

export default async function (
  appStorage: Storage,
  dispatch: Dispatch,
) {
  const { accounts = [] } = await appStorage.get('accounts');
  let { history = {} } = await appStorage.get('history');

  const activeAccount = getActiveAccount(accounts || []);

  if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
    const accountAddress = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
    const accountHistory = (history[accountId] || []);
    const cleanedHistory = accountHistory
      .filter(tx => addressesEqual(tx.to, accountAddress) || addressesEqual(tx.from, accountAddress));

    if (accountHistory.length !== cleanedHistory.length) {
      history = updateAccountHistory(history, accountId, cleanedHistory);
      dispatch(saveStorageAction(appStorage, 'history', { history }, true));
    }
  }

  if (Array.isArray(history) && accounts.length) {
    const migratedHistory = migrateTxHistoryToAccountsFormat(history, accounts);
    if (migratedHistory) {
      history = migratedHistory;
      dispatch(saveStorageAction(appStorage, 'history', { history }, true));
    }
  }

  if (!isEmpty(history)) {
    dispatch({ type: SET_HISTORY, payload: history });
  }
}
