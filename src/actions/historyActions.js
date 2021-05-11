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
import isEmpty from 'lodash.isempty';

// constants
import {
  SET_HISTORY,
  SET_GAS_INFO,
  TX_PENDING_STATUS,
  ADD_TRANSACTION,
  UPDATING_TRANSACTION,
} from 'constants/historyConstants';
import { SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// utils
import {
  getTrxInfo,
  parseFeeWithGasToken,
  updateAccountHistory,
  updateHistoryRecord,
} from 'utils/history';
import {
  getAccountAddress,
  getAccountId,
  findFirstArchanovaAccount,
  isArchanovaAccount,
} from 'utils/accounts';
import { getAssetsAsList } from 'utils/assets';
import { reportLog, uniqBy } from 'utils/common';
import {
  deviceHasGasTokenSupport,
  getGasTokenDetails,
  parseArchanovaTransactionStatus,
  parseArchanovaTransactions,
} from 'utils/archanova';
import { mapTransactionsHistoryWithAave } from 'utils/aave';
import { mapTransactionsPoolTogether } from 'utils/poolTogether';
import { mapTransactionsHistoryWithSablier } from 'utils/sablier';
import { mapTransactionsHistoryWithRari } from 'utils/rari';
import { mapTransactionsHistoryWithLiquidityPools } from 'utils/liquidityPools';

// services
import archanovaService from 'services/archanova';

// selectors
import { archanovaAccountAssetsSelector } from 'selectors/assets';
import { activeAccountSelector, historySelector } from 'selectors';

// models, types
import type { Transaction } from 'models/Transaction';
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';

// actions
import { fetchAssetsBalancesAction } from './assetsActions';
import { saveDbAction } from './dbActions';
import { syncVirtualAccountTransactionsAction } from './smartWalletActions';
import { checkEnableExchangeAllowanceTransactionsAction } from './exchangeActions';
import { extractEnsInfoFromTransactionsAction } from './ensRegistryActions';


export const afterHistoryUpdatedAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(checkEnableExchangeAllowanceTransactionsAction());
  };
};

export const syncAccountHistory = (
  apiHistory: Transaction[],
  accountId: string,
  dispatch: Dispatch,
  getState: GetState,
) => {
  const { history: { data: currentHistory } } = getState();
  const accountHistory = currentHistory[accountId] || [];

  const pendingTransactions = apiHistory.filter(tx => tx.status === TX_PENDING_STATUS);
  const minedTransactions = apiHistory.filter(tx => tx.status !== TX_PENDING_STATUS);

  const updatedAccountHistory = uniqBy([...minedTransactions, ...accountHistory, ...pendingTransactions], 'hash');
  const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);

  dispatch(saveDbAction('history', { history: updatedHistory }, true));

  dispatch({
    type: SET_HISTORY,
    payload: updatedHistory,
  });

  dispatch(afterHistoryUpdatedAction());
};

export const fetchSmartWalletTransactionsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
    } = getState();

    // key based history migration: clean existing
    const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
    if (keyBasedAccount) {
      const keyBasedAccountId = getAccountId(keyBasedAccount);
      const currentHistory = historySelector(getState());
      if (!isEmpty(currentHistory[keyBasedAccountId])) {
        const updatedHistory = updateAccountHistory(currentHistory, keyBasedAccountId, []);
        await dispatch(saveDbAction('history', { history: updatedHistory }, true));
        dispatch({ type: SET_HISTORY, payload: updatedHistory });
      }
    }

    if (!isOnline) return;

    // fetch archanova history only if archanova account exists
    const achanovaAccount = findFirstArchanovaAccount(accounts);
    if (achanovaAccount) {
      const {
        smartWallet: {
          lastSyncedTransactionId,
          connectedAccount,
        },
        assets: { supportedAssets },
      } = getState();

      if (!connectedAccount) {
        reportLog('fetchSmartWalletTransactionsAction failed, no connected account');
        return;
      }

      const devices = connectedAccount?.devices || [];

      await dispatch(syncVirtualAccountTransactionsAction());

      const accountId = getAccountId(achanovaAccount);
      const accountAddress = getAccountAddress(achanovaAccount);

      const smartWalletTransactions = await archanovaService.getAccountTransactions(lastSyncedTransactionId);
      const accountAssets = archanovaAccountAssetsSelector(getState());
      const relayerExtensionDevice = devices.find(deviceHasGasTokenSupport);
      const assetsList = getAssetsAsList(accountAssets);
      const smartWalletTransactionHistory = parseArchanovaTransactions(
        smartWalletTransactions,
        supportedAssets,
        assetsList,
        relayerExtensionDevice?.address,
      );
      const aaveHistory = await mapTransactionsHistoryWithAave(accountAddress, smartWalletTransactionHistory);
      const poolTogetherHistory = await mapTransactionsPoolTogether(accountAddress, aaveHistory);
      const sablierHistory = await mapTransactionsHistoryWithSablier(accountAddress, poolTogetherHistory);
      const rariHistory = await mapTransactionsHistoryWithRari(accountAddress, sablierHistory, supportedAssets);
      const history = await mapTransactionsHistoryWithLiquidityPools(accountAddress, rariHistory);

      if (!history.length) return;
      // jd: are these new txs? if so, map over them and for every WBTC tx, clear last pending tx
      if (smartWalletTransactions.length) {
        const newLastSyncedId = smartWalletTransactions[0].id;
        dispatch({
          type: SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID,
          payload: newLastSyncedId,
        });
        dispatch(saveDbAction('smartWallet', { lastSyncedTransactionId: newLastSyncedId }));
      }

      syncAccountHistory(history, accountId, dispatch, getState);
      dispatch(extractEnsInfoFromTransactionsAction(smartWalletTransactions));
    }

    // TODO: fetch etherspot account history
  };
};

export const fetchGasInfoAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const gasInfo = await api.fetchGasInfo();
    dispatch({
      type: SET_GAS_INFO,
      payload: gasInfo,
    });
  };
};

const setUpdatingTransactionAction = (hash: ?string) => ({
  type: UPDATING_TRANSACTION,
  payload: hash,
});

export const updateTransactionStatusAction = (hash: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const { session: { data: { isOnline } } } = getState();

    if (!isOnline) return;

    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) return;

    const isArchanovaAccountActive = isArchanovaAccount(activeAccount);

    dispatch(setUpdatingTransactionAction(hash));

    const trxInfo = await getTrxInfo(api, hash);

    let sdkTransactionInfo;
    let sdkToAppStatus;
    if (isArchanovaAccountActive) {
      sdkTransactionInfo = await archanovaService.getTransactionInfo(hash);
      if (!sdkTransactionInfo) {
        dispatch(setUpdatingTransactionAction(null));
        return;
      }

      sdkToAppStatus = parseArchanovaTransactionStatus(sdkTransactionInfo.state);

      // NOTE: if trxInfo is not null, that means transaction was mined or failed
      if (sdkToAppStatus === TX_PENDING_STATUS && trxInfo) {
        reportLog('Wrong transaction status', {
          hash,
          sdkToAppStatus,
          sdkStatus: sdkTransactionInfo?.state,
          blockchainStatus: trxInfo.status,
        });
        dispatch(setUpdatingTransactionAction(null));
        return;
      }
    }

    // NOTE: when trxInfo is null, that means transaction status is still pending or timed out
    const stillPending = isArchanovaAccountActive
      ? sdkToAppStatus === TX_PENDING_STATUS
      : !trxInfo;

    if (stillPending) {
      dispatch(setUpdatingTransactionAction(null));
      return;
    }

    let gasPrice;
    let gasUsed;
    let status;
    let feeWithGasToken;

    if (isArchanovaAccountActive && sdkTransactionInfo) {
      gasPrice = sdkTransactionInfo.gas.price;
      gasUsed = sdkTransactionInfo.gas.used;
      status = sdkToAppStatus;

      // attach gas token info
      const gasTokenAddress = sdkTransactionInfo.gasToken;
      const transactionFee = sdkTransactionInfo.fee;
      if (!isEmpty(gasTokenAddress) && transactionFee) {
        const supportedAssets = get(getState(), 'assets.supportedAssets', []);
        const accountAssets = getAssetsAsList(archanovaAccountAssetsSelector(getState()));
        const gasToken = getGasTokenDetails(accountAssets, supportedAssets, gasTokenAddress);
        if (!isEmpty(gasToken)) {
          feeWithGasToken = parseFeeWithGasToken(gasToken, transactionFee);
        }
      }
    } else if (trxInfo) {
      ({
        txInfo: { gasPrice },
        txReceipt: { gasUsed },
        status,
      } = trxInfo);
    }

    const { history: { data: currentHistory } } = getState();
    const { updatedHistory } = updateHistoryRecord(
      currentHistory,
      hash,
      (transaction) => ({
        ...transaction,
        status,
        gasPrice: gasPrice ? gasPrice.toNumber() : transaction.gasPrice,
        gasUsed: gasUsed ? gasUsed.toNumber() : transaction.gasUsed,
        feeWithGasToken: feeWithGasToken || transaction.feeWithGasToken,
      }));

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });

    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch(afterHistoryUpdatedAction());
    dispatch(fetchAssetsBalancesAction());
  };
};

export const insertTransactionAction = (historyTx: Transaction, accountId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ADD_TRANSACTION,
      payload: {
        accountId,
        historyTx,
      },
    });

    // get the updated state and save it into the storage
    const { history: { data: currentHistory } } = getState();
    await dispatch(saveDbAction('history', { history: currentHistory }, true));
  };
};

export const setHistoryTransactionStatusByHashAction = (transactionHash: string, status: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const transactionsHistory = historySelector(getState());

    const { txUpdated, updatedHistory } = updateHistoryRecord(
      transactionsHistory,
      transactionHash,
      (transaction) => ({ ...transaction, status }),
    );

    // check if updated
    if (!txUpdated) return;

    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({ type: SET_HISTORY, payload: updatedHistory });
  };
};
