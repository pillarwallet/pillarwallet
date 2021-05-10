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
  SET_ACCOUNT_HISTORY_LAST_SYNC_ID,
} from 'constants/historyConstants';
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
  findFirstEtherspotAccount,
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
import { parseEtherspotTransactions } from 'utils/etherspot';

// services
import archanovaService from 'services/archanova';
import etherspotService from 'services/etherspot';

// selectors
import {
  archanovaAccountAssetsSelector,
  etherspotAccountAssetsSelector,
} from 'selectors/assets';
import {
  activeAccountSelector,
  historySelector,
  supportedAssetsSelector,
} from 'selectors';

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

export const syncAccountHistoryAction = (
  apiHistory: Transaction[],
  accountId: string,
  lastSyncId: ?string,
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { history: { data: currentHistory, historyLastSyncIds = {} } } = getState();
    const accountHistory = currentHistory[accountId] || [];

    const pendingTransactions = apiHistory.filter(tx => tx.status === TX_PENDING_STATUS);
    const minedTransactions = apiHistory.filter(tx => tx.status !== TX_PENDING_STATUS);

    const updatedAccountHistory = uniqBy([...minedTransactions, ...accountHistory, ...pendingTransactions], 'hash');
    const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);

    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({ type: SET_HISTORY, payload: updatedHistory });
    dispatch(afterHistoryUpdatedAction());

    if (lastSyncId) {
      dispatch({ type: SET_ACCOUNT_HISTORY_LAST_SYNC_ID, payload: { accountId, lastSyncId } });
      const updatedHistoryLastSyncIds = { ...historyLastSyncIds, [accountId]: lastSyncId };
      dispatch(saveDbAction('historyLastSyncIds', { historyLastSyncIds: updatedHistoryLastSyncIds }, true));
    }
  };
};

export const fetchTransactionsHistoryAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
      history: { historyLastSyncIds },
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

    let newHistoryTransactions = [];
    const supportedAssets = supportedAssetsSelector(getState());

    // archanova history
    const achanovaAccount = findFirstArchanovaAccount(accounts);
    if (achanovaAccount) {
      const {
        smartWallet: {
          lastSyncedTransactionId: lastSyncedArchanovaTransactionId,
          connectedAccount,
        },
      } = getState();

      if (!connectedAccount) {
        reportLog('fetchTransactionsHistoryAction failed, no connected account');
        return;
      }

      const devices = connectedAccount?.devices || [];

      await dispatch(syncVirtualAccountTransactionsAction());

      const accountId = getAccountId(achanovaAccount);
      const accountAddress = getAccountAddress(achanovaAccount);

      const lastSyncedId = historyLastSyncIds?.[accountId] || lastSyncedArchanovaTransactionId;
      const archanovaTransactions = await archanovaService.getAccountTransactions(+lastSyncedId);

      const accountAssets = archanovaAccountAssetsSelector(getState());
      const relayerExtensionDevice = devices.find(deviceHasGasTokenSupport);
      const assetsList = getAssetsAsList(accountAssets);
      const archanovaTransactionsHistory = parseArchanovaTransactions(
        archanovaTransactions,
        supportedAssets,
        assetsList,
        relayerExtensionDevice?.address,
      );
      const aaveHistory = await mapTransactionsHistoryWithAave(accountAddress, archanovaTransactionsHistory);
      const poolTogetherHistory = await mapTransactionsPoolTogether(accountAddress, aaveHistory);
      const sablierHistory = await mapTransactionsHistoryWithSablier(accountAddress, poolTogetherHistory);
      const rariHistory = await mapTransactionsHistoryWithRari(accountAddress, sablierHistory, supportedAssets);
      const finalArchanovaTransactionsHistory = await mapTransactionsHistoryWithLiquidityPools(
        accountAddress,
        rariHistory,
      );

      // TODO: Jan: are these new txs? if so, map over them and for every WBTC tx, clear last pending tx
      if (finalArchanovaTransactionsHistory.length) {
        newHistoryTransactions = [...newHistoryTransactions, ...finalArchanovaTransactionsHistory];
        const newLastSyncedId = archanovaTransactions?.[0]?.id?.toString();
        dispatch(syncAccountHistoryAction(finalArchanovaTransactionsHistory, accountId, newLastSyncedId));
      }
    }

    // etherspot history
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (etherspotAccount) {
      const accountAddress = getAccountAddress(etherspotAccount);
      const accountAssets = etherspotAccountAssetsSelector(getState());
      const accountId = getAccountId(etherspotAccount);

      const etherspotTransactions = await etherspotService.getTransactionsByAddress(accountAddress);

      if (etherspotTransactions?.length) {
        const etherspotTransactionsHistory = parseEtherspotTransactions(
          etherspotTransactions,
          getAssetsAsList(accountAssets),
          supportedAssets,
        );

        newHistoryTransactions = [...newHistoryTransactions, ...etherspotTransactionsHistory];
        dispatch(syncAccountHistoryAction(etherspotTransactionsHistory, accountId));
      }
    }

    dispatch(extractEnsInfoFromTransactionsAction(newHistoryTransactions));
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

const setUpdatingTransaction = (hash: ?string) => ({
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

    dispatch(setUpdatingTransaction(hash));

    const trxInfo = await getTrxInfo(api, hash);

    let sdkTransactionInfo;
    let sdkToAppStatus;
    if (isArchanovaAccountActive) {
      sdkTransactionInfo = await archanovaService.getTransactionInfo(hash);
      if (!sdkTransactionInfo) {
        dispatch(setUpdatingTransaction(null));
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
        dispatch(setUpdatingTransaction(null));
        return;
      }
    }

    // NOTE: when trxInfo is null, that means transaction status is still pending or timed out
    const stillPending = isArchanovaAccountActive
      ? sdkToAppStatus === TX_PENDING_STATUS
      : !trxInfo;

    if (stillPending) {
      dispatch(setUpdatingTransaction(null));
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
