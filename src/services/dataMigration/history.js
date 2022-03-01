// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { isEmpty } from 'lodash';

// constants
import { SET_HISTORY } from 'constants/historyConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { saveDbAction } from 'actions/dbActions';

// utils
import {
  getActiveAccount,
  getActiveAccountAddress,
  getActiveAccountId,
  isArchanovaAccount,
} from 'utils/accounts';
import { addressesEqual } from 'utils/assets';
import {
  transactionStoreHasOldStructure,
  updateAccountHistoryForChain,
} from 'utils/history';
import { logBreadcrumb } from 'utils/common';


export default async function (storageData: Object, dispatch: Function, getState: Function) {
  const isMigratedToReduxPersist = !!storageData?.dataMigration?.migratedToReduxPersist?.history;
  const accounts = storageData?.accounts?.accounts ?? []; // not a mistype
  let history = storageData?.history?.history ?? {}; // not a mistype

  const { history: { data: stateHistory } } = getState();
  const activeAccount = getActiveAccount(accounts || []);

  // check if the data was migrated, but the current state is empty and history from storage is not empty
  if (isMigratedToReduxPersist && isEmpty(stateHistory) && !isEmpty(history)) {
    logBreadcrumb('redux-persist', 'Possible redux-persist crash');
  }

  if (transactionStoreHasOldStructure(history)) {
    history = Object.keys(history).reduce((
      updated,
      accountId,
    ) => ({
      ...updated,
      [accountId]: { ethereum: history[accountId] ?? [] },
    }), {});
    dispatch({ type: SET_HISTORY, payload: history });
    dispatch(saveDbAction('history', { history }, true));
  }

  // checks history if wrong was written during initial migration for per chain history
  const chainsKeys = Object.values(CHAIN);
  const historyHasWrongKeys = Object.keys(history).some((accountId) => {
    const accountHistory = history[accountId] ?? {};
    return Object.keys(accountHistory).some((chainKey) => !chainsKeys.includes(chainKey));
  });
  if (historyHasWrongKeys) {
    history = Object.keys(history).reduce((fixedHistory, accountId) => {
      const accountHistory = history[accountId] ?? {};

      const fixedAccountHistory = Object.keys(accountHistory).reduce((
        fixedChainsHistory,
        chainKey,
      ) => {
        // drop key if it's not chain
        if (!chainsKeys.includes(chainKey)) return fixedChainsHistory;

        // $FlowFixMe
        return { ...fixedChainsHistory, [chainKey]: accountHistory[chainKey] };
      }, {});

      return { ...fixedHistory, [accountId]: fixedAccountHistory };
    }, {});
    dispatch({ type: SET_HISTORY, payload: history });
    dispatch(saveDbAction('history', { history }, true));
  }

  // legacy cleanup migration used by Archanova accounts
  if (activeAccount && isArchanovaAccount(activeAccount)) {
    const accountAddress = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
    const accountHistoryItems = history[accountId] && Array.isArray(history[accountId])
      ? history[accountId]
      : [];
    const cleanedHistoryItems = accountHistoryItems
      .filter(tx => addressesEqual(tx.to, accountAddress) || addressesEqual(tx.from, accountAddress));

    if (accountHistoryItems.length !== cleanedHistoryItems.length) {
      history = updateAccountHistoryForChain(history, accountId, CHAIN.ETHEREUM, cleanedHistoryItems);
      dispatch(saveDbAction('history', { history }, true));
      dispatch({ type: SET_HISTORY, payload: history });
    }
  }

  // data migrated, no need to do anything
  if (isMigratedToReduxPersist) {
    // TODO: remove this dispatch method once we decide to fully use the redux-persist
    dispatch({ type: SET_HISTORY, payload: history });
    return;
  }

  await dispatch(saveDbAction('dataMigration', { migratedToReduxPersist: { history: +new Date() } }));

  dispatch({ type: SET_HISTORY, payload: history });
}
