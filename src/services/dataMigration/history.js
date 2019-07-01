// @flow
import { Sentry } from 'react-native-sentry';
import isEmpty from 'lodash.isempty';
import { saveDbAction } from 'actions/dbActions';
import { SET_HISTORY } from 'constants/historyConstants';
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

export default async function (dispatch: Function, getState: Function) {
  const { migratedToReduxPersist = {} } = await storage.get('dataMigration');
  const { accounts = [] } = await storage.get('accounts');
  const { history = {} } = await storage.get('history');
  const { history: { data: stateHistory } } = getState();

  // check if the data was migrated, but the current state is empty and history from storage is not empty
  if (migratedToReduxPersist.history && isEmpty(stateHistory) && !isEmpty(history)) {
    Sentry.captureMessage('Possible redux-persist crash', { level: 'info' });
  }

  // data migrated, no need to do anything
  if (migratedToReduxPersist.history) {
    // TODO: remove this dispatch method once we decide to fully use the redux-persist
    dispatch({ type: SET_HISTORY, payload: history });
    return;
  }

  await dispatch(saveDbAction('dataMigration', { migratedToReduxPersist: { history: +new Date() } }));

  if (Array.isArray(history) && accounts.length) {
    const migratedHistory = migrateTxHistoryToAccountsFormat(history, accounts);
    if (migratedHistory) {
      dispatch(saveDbAction('history', { history: migratedHistory }, true));
      dispatch({ type: SET_HISTORY, payload: migratedHistory });
      return;
    }
  }

  dispatch({ type: SET_HISTORY, payload: history });
}
