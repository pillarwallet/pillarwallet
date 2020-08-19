// @flow
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { saveDbAction } from 'actions/dbActions';
import { SET_HISTORY } from 'constants/historyConstants';
import {
  checkIfSmartWalletAccount,
  getActiveAccount,
  getActiveAccountAddress,
  getActiveAccountId,
} from 'utils/accounts';
import { addressesEqual } from 'utils/assets';
import { updateAccountHistory } from 'utils/history';
import { reportLog } from 'utils/common';


export default async function (storageData: Object, dispatch: Function, getState: Function) {
  const { migratedToReduxPersist = {} } = get(storageData, 'dataMigration', {});
  const { accounts = [] } = get(storageData, 'accounts', {});
  let { history = {} } = get(storageData, 'history', {});
  const { history: { data: stateHistory } } = getState();
  const activeAccount = getActiveAccount(accounts || []);

  // check if the data was migrated, but the current state is empty and history from storage is not empty
  if (migratedToReduxPersist.history && isEmpty(stateHistory) && !isEmpty(history)) {
    reportLog('Possible redux-persist crash');
  }

  if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
    const accountAddress = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
    const accountHistory = (history[accountId] || []);
    const cleanedHistory = accountHistory
      .filter(tx => addressesEqual(tx.to, accountAddress) || addressesEqual(tx.from, accountAddress));

    if (accountHistory.length !== cleanedHistory.length) {
      history = updateAccountHistory(history, accountId, cleanedHistory);
      dispatch(saveDbAction('history', { history }, true));
      dispatch({ type: SET_HISTORY, payload: history });
    }
  }

  // data migrated, no need to do anything
  if (migratedToReduxPersist.history) {
    // TODO: remove this dispatch method once we decide to fully use the redux-persist
    dispatch({ type: SET_HISTORY, payload: history });
    return;
  }

  await dispatch(saveDbAction('dataMigration', { migratedToReduxPersist: { history: +new Date() } }));

  dispatch({ type: SET_HISTORY, payload: history });
}
