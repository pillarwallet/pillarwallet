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
import { uniqBy } from 'utils/common';
import {
  SET_HISTORY,
  TRANSACTION_PENDING_EVENT,
  TRANSACTION_CONFIRMATION_EVENT,
  SET_GAS_INFO,
  TX_CONFIRMED_STATUS,
  TX_FAILED_STATUS,
  TX_PENDING_STATUS,
} from 'constants/historyConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { checkForMissedAssetsAction } from './assetsActions';
import { saveDbAction } from './dbActions';
import { getExistingTxNotesAction } from './txNoteActions';

const TRANSACTIONS_HISTORY_STEP = 10;

export const fetchTransactionsHistoryAction = (walletAddress: string, asset: string = 'ALL', fromIndex: number = 0) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const history = await api.fetchHistory({
      address1: walletAddress,
      asset,
      nbTx: TRANSACTIONS_HISTORY_STEP,
      fromIndex,
    });
    if (!history.length) return;

    const { history: { data: currentHistory } } = getState();
    const updatedHistory = uniqBy([...history, ...currentHistory], 'hash');
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch(getExistingTxNotesAction());

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
  };
};

export const fetchContactTransactionsAction = (myAddress: string, contactAddress: string, asset?: string = 'ALL') => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const history = await api.fetchHistory({
      address1: myAddress,
      address2: contactAddress,
      asset,
      nbTx: TRANSACTIONS_HISTORY_STEP,
      fromIndex: 0,
    });
    if (!history.length) return;

    const { history: { data: currentHistory } } = getState();
    const updatedHistory = uniqBy([...history, ...currentHistory], 'hash');
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
  };
};

export const fetchTransactionsHistoryNotificationsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      history: { data: currentHistory },
      appSettings: { data: { lastTxSyncDatetime } },
    } = getState();

    const d = new Date(lastTxSyncDatetime * 1000);
    const types = [
      TRANSACTION_PENDING_EVENT,
      TRANSACTION_CONFIRMATION_EVENT,
    ];
    const historyNotifications = await api.fetchNotifications(walletId, types.join(' '), d.toISOString());
    const mappedHistoryNotifications = historyNotifications
      .map(({ payload, type, createdAt }) => ({ ...payload, type, createdAt }));

    dispatch(checkForMissedAssetsAction(mappedHistoryNotifications));

    const minedTransactions = mappedHistoryNotifications
      .filter(tx => tx.status !== TX_PENDING_STATUS)
      .reduce((memo, tx) => {
        memo[tx.hash] = tx;
        return memo;
      }, {});

    const pendingTransactions = mappedHistoryNotifications
      .filter(tx => tx.status === TX_PENDING_STATUS);

    // add new records & update data for mined transactions
    const updatedHistory = uniqBy([...currentHistory, ...pendingTransactions], 'hash')
      .map(tx => {
        if (!minedTransactions[tx.hash]) return tx;
        const { status, gasUsed, blockNumber } = minedTransactions[tx.hash];
        return {
          ...tx,
          status,
          gasUsed,
          blockNumber,
        };
      });

    const lastCreatedAt = Math.max(...updatedHistory.map(({ createdAt }) => createdAt).concat(0));
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch(saveDbAction('app_settings', { appSettings: { lastTxSyncDatetime: lastCreatedAt } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { lastTxSyncDatetime: lastCreatedAt },
    });
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
  };
};

export const fetchGasInfoAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const gasInfo = await api.fetchGasInfo();
    dispatch({
      type: SET_GAS_INFO,
      payload: gasInfo,
    });
  };
};

export const updateTransactionStatusAction = (hash: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      session: { data: { isOnline } },
      history: { data: history },
    } = getState();

    if (!isOnline) return;

    const txInfo = await api.fetchTxInfo(hash);
    const txReceipt = await api.fetchTransactionReceipt(hash);
    const lastBlockNumber = await api.fetchLastBlockNumber();
    if (!txInfo || !txReceipt || !lastBlockNumber) return;

    const nbConfirmations = lastBlockNumber - txReceipt.blockNumber;
    const status = txReceipt.status ? TX_CONFIRMED_STATUS : TX_FAILED_STATUS;

    const updatedHistory = history.map(tx => {
      if (tx.hash !== hash) return tx;
      return {
        ...tx,
        nbConfirmations,
        status,
      };
    });
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
  };
};
