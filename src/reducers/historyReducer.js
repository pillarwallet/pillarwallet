// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import get from 'lodash.get';
import { REHYDRATE } from 'redux-persist';
import {
  SET_HISTORY,
  ADD_HISTORY_TRANSACTION,
  SET_GAS_INFO,
  SET_UPDATING_TRANSACTION,
  SET_ACCOUNT_HISTORY_LAST_SYNC_ID,
  SET_HISTORY_LAST_SYNC_IDS,
  SET_FETCHING_HISTORY,
} from 'constants/historyConstants';
import type { TransactionsStore, HistoryLastSyncIds } from 'models/History';
import type { ChainRecord } from 'models/Chain';
import type { Transaction } from 'models/Transaction';
import type { GasInfoPerChain } from 'models/GasInfo';

export type HistoryReducerState = {
  data: TransactionsStore,
  gasInfo: GasInfoPerChain,
  isFetched: boolean,
  updatingTransaction: ?string,
  historyLastSyncIds?: HistoryLastSyncIds,
  isFetching: boolean,
}

export type HistoryAction = {
  type: string,
  payload: any,
}

export const initialState = {
  data: {},
  gasInfo: {
    ethereum: {
      gasPrice: null,
      isFetched: false,
    },
  },
  isFetched: false,
  updatingTransaction: null,
  isFetching: false,
};

const addAccountTransaction = (
  accountHistory: ChainRecord<Transaction[]>,
  transactionToAdd: { chain: string, transaction: Transaction },
) => {
  const { chain, transaction } = transactionToAdd;
  const accountHistoryForChain = accountHistory?.[chain] ?? [];
  return {
    ...accountHistory,
    [chain]: accountHistoryForChain.concat(transaction),
  };
};

export default function historyReducer(
  state: HistoryReducerState = initialState,
  action: HistoryAction,
): HistoryReducerState {
  let accountId;
  const { historyLastSyncIds = {} } = state;

  switch (action.type) {
    case REHYDRATE:
      return {
        ...state,
        data: get(action.payload, 'history.data', {}),
      };
    case ADD_HISTORY_TRANSACTION:
      ({ accountId } = action.payload);
      const accountHistory = state.data[accountId];

      return {
        ...state,
        data: {
          ...state.data,
          [accountId]: addAccountTransaction(accountHistory, action.payload),
        },
      };
    case SET_HISTORY:
      return {
        ...state,
        data: action.payload,
        isFetched: true,
        updatingTransaction: null,
      };
    case SET_GAS_INFO:
      const { gasPrice, chain } = action.payload;
      return {
        ...state,
        gasInfo: {
          ...state.gasInfo,
          [chain]: { gasPrice, isFetched: !!gasPrice },
        },
      };
    case SET_UPDATING_TRANSACTION:
      return { ...state, updatingTransaction: action.payload };
    case SET_HISTORY_LAST_SYNC_IDS:
      return { ...state, historyLastSyncIds: { ...historyLastSyncIds, ...action.payload } };
    case SET_ACCOUNT_HISTORY_LAST_SYNC_ID:
      ({ accountId } = action.payload);
      const { lastSyncId } = action.payload;
      return { ...state, historyLastSyncIds: { ...historyLastSyncIds, [accountId]: lastSyncId } };
    case SET_FETCHING_HISTORY:
      return { ...state, isFetching: action.payload };
    default:
      return state;
  }
}
