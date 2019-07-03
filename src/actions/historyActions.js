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
import orderBy from 'lodash.orderby';
import { BigNumber } from 'bignumber.js';
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
import { buildHistoryTransaction, updateAccountHistory } from 'utils/history';
import { getActiveAccountAddress, getActiveAccountId, getActiveAccountWalletId } from 'utils/accounts';
import { checkForMissedAssetsAction } from './assetsActions';
import { saveDbAction } from './dbActions';
import { getExistingTxNotesAction } from './txNoteActions';
import { checkAssetTransferTransactionsAction } from './smartWalletActions';
import { checkEnableExchangeAllowanceTransactionsAction } from './exchangeActions';
import { ETH } from '../constants/assetsConstants';

const TRANSACTIONS_HISTORY_STEP = 10;

const afterHistoryUpdatedAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      featureFlags: {
        data: {
          SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
          EXCHANGE_ENABLED: exchangeFeatureEnabled,
        },
      },
    } = getState();
    if (smartWalletFeatureEnabled) dispatch(checkAssetTransferTransactionsAction());
    if (exchangeFeatureEnabled) dispatch(checkEnableExchangeAllowanceTransactionsAction());
  };
};

export const fetchTransactionsHistoryAction = (asset: string = 'ALL', fromIndex: number = 0) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      accounts: { data: accounts },
      history: { data: currentHistory },
    } = getState();
    const accountId = getActiveAccountId(accounts);
    const accountAddress = getActiveAccountAddress(accounts);

    const history = await api.fetchHistory({
      address1: accountAddress,
      asset,
      nbTx: TRANSACTIONS_HISTORY_STEP,
      fromIndex,
    });
    if (!history.length) return;

    const accountHistory = currentHistory[accountId] || [];
    const updatedAccountHistory = uniqBy([...history, ...accountHistory], 'hash');
    const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch(getExistingTxNotesAction());

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });

    dispatch(afterHistoryUpdatedAction());
  };
};

export const fetchContactTransactionsAction = (contactAddress: string, asset?: string = 'ALL') => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      accounts: { data: accounts },
      history: { data: currentHistory },
    } = getState();
    const accountId = getActiveAccountId(accounts);
    const accountAddress = getActiveAccountAddress(accounts);

    const history = await api.fetchHistory({
      address1: accountAddress,
      address2: contactAddress,
      asset,
      nbTx: TRANSACTIONS_HISTORY_STEP,
      fromIndex: 0,
    });
    if (!history.length) return;

    const accountHistory = currentHistory[accountId] || [];
    const updatedAccountHistory = uniqBy([...history, ...accountHistory], 'hash');
    const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });

    dispatch(afterHistoryUpdatedAction());
  };
};

export const fetchTransactionsHistoryNotificationsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      accounts: { data: accounts },
      history: { data: currentHistory },
      appSettings: { data: { lastTxSyncDatetimes = {} } },
    } = getState();
    const accountId = getActiveAccountId(accounts);
    const walletId = getActiveAccountWalletId(accounts);
    const lastTxSyncDatetime = lastTxSyncDatetimes[accountId] || 0;

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
    const accountHistory = (currentHistory[accountId] || []).filter(tx => !!tx.createdAt);
    const updatedAccountHistory = uniqBy([...accountHistory, ...pendingTransactions], 'hash')
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

    const lastCreatedAt = Math.max(...updatedAccountHistory.map(({ createdAt }) => createdAt).concat(0)) || 0;
    const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    const updatedLastTxSyncDatetimes = {
      ...lastTxSyncDatetimes,
      [accountId]: lastCreatedAt,
    };
    dispatch(saveDbAction('app_settings', { appSettings: { lastTxSyncDatetimes: updatedLastTxSyncDatetimes } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { lastTxSyncDatetimes: updatedLastTxSyncDatetimes },
    });
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
    dispatch(afterHistoryUpdatedAction());
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
      accounts: { data: accounts },
      session: { data: { isOnline } },
      history: { data: currentHistory },
    } = getState();
    const accountId = getActiveAccountId(accounts);

    if (!isOnline) return;

    const txInfo = await api.fetchTxInfo(hash);
    const txReceipt = await api.fetchTransactionReceipt(hash);
    const lastBlockNumber = await api.fetchLastBlockNumber();
    if (!txInfo || !txReceipt || !lastBlockNumber) return;

    const nbConfirmations = lastBlockNumber - txReceipt.blockNumber;
    const status = txReceipt.status ? TX_CONFIRMED_STATUS : TX_FAILED_STATUS;

    const accountHistory = currentHistory[accountId] || [];
    const updatedAccountHistory = accountHistory.map(tx => {
      if (tx.hash !== hash) return tx;
      return {
        ...tx,
        nbConfirmations,
        status,
      };
    });
    const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });

    dispatch(afterHistoryUpdatedAction());

    dispatch(saveDbAction('history', { history: updatedHistory }, true));
  };
};

export const restoreTransactionHistoryAction = (walletAddress: string, walletId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      accounts: { data: accounts },
      history: { data: currentHistory },
    } = getState();

    const [allAssets, _erc20History, ethHistory] = await Promise.all([
      api.fetchSupportedAssets(walletId),
      api.importedErc20TransactionHistory(walletAddress),
      api.importedEthTransactionHistory(walletAddress),
    ]);
    if (!allAssets || !allAssets.length) return;

    const erc20History = _erc20History.filter(tx => {
      const hashExists = ethHistory.find(el => el.hash === tx.transactionHash);
      return !hashExists;
    });

    const accountId = getActiveAccountId(accounts);
    const accountHistory = currentHistory[accountId] || [];

    // 1) filter out frecords those exists in accountHistory
    const ethTransactions = ethHistory.filter(tx => {
      const hashExists = accountHistory.find(el => el.hash === tx.hash);
      return !hashExists;
    });

    // 2) filter out records those exists in accountHistory
    const erc20Transactions = erc20History
      .filter(tx => {
        const hashExists = accountHistory.find(el => el.hash === tx.transactionHash);
        return !hashExists;
      })
      // 3) filter out unsupported tokens
      .filter(tx => {
        const tokenAddress = get(tx, 'tokenInfo.address');
        const tokenSupported = allAssets.find(el => el.address === tokenAddress);
        return !!tokenAddress && tokenSupported;
      });

    // 4) combine accountHistory, ethHistory and erc20History (convert to the same format)
    const updatedAccountHistory = [
      ...accountHistory,
      ...ethTransactions.map(tx => buildHistoryTransaction({
        from: tx.from,
        to: tx.to,
        hash: tx.hash,
        value: new BigNumber((tx.value) * (10 ** 18)),
        asset: ETH,
        createdAt: tx.timestamp,
        status: tx.success ? TX_CONFIRMED_STATUS : TX_FAILED_STATUS,
      })),
      ...erc20Transactions.map(tx => {
        const tokenAddress = get(tx, 'tokenInfo.address');
        const assetInfo = allAssets.find(el => el.address === tokenAddress) || {};
        return buildHistoryTransaction({
          asset: assetInfo.symbol,
          createdAt: tx.timestamp,
          from: tx.from,
          hash: tx.transactionHash,
          protocol: 'Ethereum',
          status: TX_CONFIRMED_STATUS,
          to: tx.to,
          value: new BigNumber(tx.value).toString(),
        });
      }),
    ];

    // 5) sort by date
    const sortedHistory = orderBy(updatedAccountHistory, ['createdAt'], ['asc']);

    // 6) update history in storage
    const updatedHistory = updateAccountHistory(currentHistory, accountId, sortedHistory);

    await dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
  };
};
