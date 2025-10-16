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
import t from 'translations/translate';

// components
import Toast from 'components/Toast';

// constants
import {
  SET_HISTORY,
  SET_GAS_INFO,
  TX_PENDING_STATUS,
  SET_ACCOUNT_HISTORY_LAST_SYNC_ID,
  SET_FETCHING_HISTORY,
} from 'constants/historyConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import { updateAccountHistoryForChain, updateHistoryRecord } from 'utils/history';
import { getAccountAddress, getAccountId, findFirstEtherspotAccount, findAccountByAddress } from 'utils/accounts';
import { reportLog, uniqBy } from 'utils/common';
import { parseEtherspotTransactions } from 'utils/etherspot';
import { viewTransactionOnBlockchain } from 'utils/blockchainExplorer';
import { getSupportedChains } from 'utils/chains';

// services
import etherspotService from 'services/etherspot';

// selectors
import { accountsSelector, historySelector, supportedAssetsPerChainSelector } from 'selectors';

// models, types
import type { Transaction } from 'models/Transaction';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Event } from 'models/History';
import type { Chain } from 'models/Chain';

// actions
import { saveDbAction } from './dbActions';
import { extractEnsInfoFromTransactionsAction } from './ensRegistryActions';

export const syncAccountHistoryAction = (
  apiHistory: Transaction[],
  accountId: string,
  chain: Chain,
  lastSyncId: ?string,
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      history: { data: currentHistory, historyLastSyncIds = {} },
    } = getState();

    const pendingTransactions = apiHistory.filter((tx) => tx.status === TX_PENDING_STATUS);
    const minedTransactions = apiHistory.filter((tx) => tx.status !== TX_PENDING_STATUS);

    const existingTransactions = currentHistory[accountId]?.[chain] || [];
    const updatedAccountHistory = uniqBy(
      [...minedTransactions, ...existingTransactions, ...pendingTransactions],
      'hash',
    );
    const updatedHistory = updateAccountHistoryForChain(currentHistory, accountId, chain, updatedAccountHistory);

    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({ type: SET_HISTORY, payload: updatedHistory });

    if (lastSyncId) {
      dispatch({ type: SET_ACCOUNT_HISTORY_LAST_SYNC_ID, payload: { accountId, lastSyncId } });
      const updatedHistoryLastSyncIds = { ...historyLastSyncIds, [accountId]: lastSyncId };
      dispatch(saveDbAction('historyLastSyncIds', { historyLastSyncIds: updatedHistoryLastSyncIds }, true));
    }
  };
};

export const setFetchingHistoryAction = (fetching: boolean) => ({
  type: SET_FETCHING_HISTORY,
  payload: fetching,
});

// TODO: fetch cross chain history when available on Etherspot SDK
export const fetchEtherspotTransactionsHistoryAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());
    const { isOnline } = getState().session.data;
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount || !isOnline) return;

    dispatch(setFetchingHistoryAction(true));

    const accountAddress = getAccountAddress(etherspotAccount);
    const accountId = getAccountId(etherspotAccount);

    await Promise.all(
      getSupportedChains(etherspotAccount).map(async (supportedChain) => {
        const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());
        const chainSupportedAssets = supportedAssetsPerChain?.[supportedChain] ?? [];

        const etherspotTransactions = await etherspotService.getTransactionsByAddress(supportedChain, accountAddress);
        if (!etherspotTransactions?.length) return;

        let etherspotTransactionsHistory;
        try {
          etherspotTransactionsHistory = parseEtherspotTransactions(
            supportedChain,
            etherspotTransactions,
            chainSupportedAssets,
          );
        } catch (error) {
          reportLog('fetchEtherspotTransactionsHistoryAction parseEtherspotTransactions failed', {
            error,
            supportedChain,
            accountAddress,
          });
        }

        if (!etherspotTransactionsHistory?.length) return;

        dispatch(syncAccountHistoryAction(etherspotTransactionsHistory, accountId, supportedChain));

        if (supportedChain !== CHAIN.ETHEREUM) return;

        dispatch(extractEnsInfoFromTransactionsAction(etherspotTransactionsHistory));
      }),
    );

    // await dispatch(fetchCollectiblesHistoryAction(etherspotAccount));

    dispatch(setFetchingHistoryAction(false));
  };
};

export const fetchTransactionsHistoryAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: {
        data: { isOnline },
      },
    } = getState();

    if (!isOnline) return;

    dispatch(setFetchingHistoryAction(true));

    await dispatch(fetchEtherspotTransactionsHistoryAction());

    dispatch(setFetchingHistoryAction(false));
  };
};

export const fetchGasInfoAction = (chain: Chain) => {
  return async (dispatch: Dispatch) => {
    const gasPrice = await etherspotService.getGasPrice(chain);
    if (!gasPrice) {
      Toast.show({
        message: t('toast.failedToGetGasPrices'),
        emoji: 'fuelpump',
        supportLink: true,
      });
      return;
    }

    dispatch({ type: SET_GAS_INFO, payload: { gasPrice, chain } });
  };
};

export const setHistoryTransactionStatusByHashAction = (transactionHash: string, status: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const transactionsHistory = historySelector(getState());

    const { txUpdated, updatedHistory } = updateHistoryRecord(transactionsHistory, transactionHash, (transaction) => ({
      ...transaction,
      status,
    }));

    // check if updated
    if (!txUpdated) return;

    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({ type: SET_HISTORY, payload: updatedHistory });
  };
};

export type TransactionInfo = {
  hash: ?string,
  batchHash: ?string,
  fromAddress: ?string,
};

export const viewTransactionOnBlockchainAction = (chain: Chain, event: Event | TransactionInfo) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { hash = null, batchHash = null, fromAddress = null } = event;

    const accounts = accountsSelector(getState());
    const fromAccount = fromAddress ? findAccountByAddress(fromAddress, accounts) : null;

    viewTransactionOnBlockchain(chain, { hash, batchHash, fromAccount });
  };
};
