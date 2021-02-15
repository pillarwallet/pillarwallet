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

import isEmpty from 'lodash.isempty';

// constants
import {
  SET_HISTORY,
  SET_GAS_INFO,
  ADD_TRANSACTION,
} from 'constants/historyConstants';

// utils
import {
  updateAccountHistory,
  updateHistoryRecord,
} from 'utils/history';
import {
  getAccountId,
  isEthersportSmartWalletType,
  findFirstEtherspotAccount,
} from 'utils/accounts';
import { reportLog } from 'utils/common';

// selectors
import { historySelector } from 'selectors';

// models, types
import type { Transaction } from 'models/Transaction';
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';

// actions
import { loadSupportedAssetsAction } from './assetsActions';
import { saveDbAction } from './dbActions';
import { checkEnableExchangeAllowanceTransactionsAction } from './exchangeActions';


export const afterHistoryUpdatedAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(checkEnableExchangeAllowanceTransactionsAction());
  };
};

// TODO: remove in favor of Etherspot?
// export const syncAccountHistory = (
//   apiHistory: Transaction[],
//   accountId: string,
//   dispatch: Dispatch,
//   getState: GetState,
// ) => {
//   const { history: { data: currentHistory } } = getState();
//   const accountHistory = currentHistory[accountId] || [];
//
//   const pendingTransactions = apiHistory.filter(tx => tx.status === TX_PENDING_STATUS);
//   const minedTransactions = apiHistory.filter(tx => tx.status !== TX_PENDING_STATUS);
//
//   const updatedAccountHistory = uniqBy([...minedTransactions, ...accountHistory, ...pendingTransactions], 'hash');
//   const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
//
//   dispatch(saveDbAction('history', { history: updatedHistory }, true));
//
//   dispatch({
//     type: SET_HISTORY,
//     payload: updatedHistory,
//   });
//
//   dispatch(afterHistoryUpdatedAction());
// };

export const fetchTransactionsHistoryAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      // smartWallet: { lastSyncedTransactionId, connectedAccount },
      session: { data: { isOnline } },
    } = getState();

    const currentHistory = historySelector(getState());

    // migration to etherspot: clean other accounts history
    accounts
      .filter((account) => !isEthersportSmartWalletType(account))
      .forEach((account) => {
        const accountId = getAccountId(account);
        if (!isEmpty(currentHistory[accountId])) {
          const updatedHistory = updateAccountHistory(currentHistory, accountId, []);
          dispatch(saveDbAction('history', { history: updatedHistory }, true));
          dispatch({ type: SET_HISTORY, payload: updatedHistory });
        }
      });

    if (!isOnline) return;

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      reportLog('fetchTransactionsHistoryAction failed, no Etherspot account');
      return;
    }

    await dispatch(loadSupportedAssetsAction());
    // const supportedAssets = get(getState(), 'assets.supportedAssets', []);

    // TODO: implement etherspot
    // await dispatch(syncVirtualAccountTransactionsAction());
    //
    // const accountId = getAccountId(smartWalletAccount);
    // const accountAddress = getAccountAddress(smartWalletAccount);
    //
    // const smartWalletTransactions = await smartWalletService.getAccountTransactions(lastSyncedTransactionId);
    // const accountAssets = smartAccountAssetsSelector(getState());
    // const relayerExtensionDevice = devices.find(deviceHasGasTokenSupport);
    // const assetsList = getAssetsAsList(accountAssets);
    // const smartWalletTransactionHistory = parseSmartWalletTransactions(
    //   smartWalletTransactions,
    //   supportedAssets,
    //   assetsList,
    //   relayerExtensionDevice?.address,
    // );
    // const aaveHistory = await mapTransactionsHistoryWithAave(accountAddress, smartWalletTransactionHistory);
    // const poolTogetherHistory = await mapTransactionsPoolTogether(accountAddress, aaveHistory);
    // const sablierHistory = await mapTransactionsHistoryWithSablier(accountAddress, poolTogetherHistory);
    // const rariHistory = await mapTransactionsHistoryWithRari(accountAddress, sablierHistory, supportedAssets);
    // const history = await mapTransactionsHistoryWithRari(accountAddress, sablierHistory, supportedAssets);
    //
    // if (!history.length) return;
    // // jd: are these new txs? if so, map over them and for every WBTC tx, clear last pending tx
    // if (smartWalletTransactions.length) {
    //   const newLastSyncedId = smartWalletTransactions[0].id;
    //   dispatch({
    //     type: SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID,
    //     payload: newLastSyncedId,
    //   });
    //   dispatch(saveDbAction('smartWallet', { lastSyncedTransactionId: newLastSyncedId }));
    // }
    //
    // syncAccountHistory(history, accountId, dispatch, getState);
    // dispatch(extractEnsInfoFromTransactionsAction(smartWalletTransactions));
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

// TODO: map with Etherspot events
// const transactionUpdate = (hash: string) => {
//   return {
//     type: UPDATING_TRANSACTION,
//     payload: hash,
//   };
// };

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


// export const updateTransactionStatusAction = (hash: string) => {
//   return async (dispatch: Dispatch, getState: GetState) => {
//     const { session: { data: { isOnline } } } = getState();
//     if (!isOnline) return;
//     const isSmartAccount = isActiveAccountTypeEtherspotSelector(getState());
//     dispatch(transactionUpdate(hash));
//
//     const trxInfo = await getTrxInfo(api, hash);
//
//     let sdkTransactionInfo;
//     let sdkToAppStatus;
//     if (isSmartAccount) {
//       sdkTransactionInfo = await smartWalletService.getTransactionInfo(hash);
//       if (!sdkTransactionInfo) {
//         dispatch(transactionUpdate(''));
//         return;
//       }
//       sdkToAppStatus = mapSdkToAppTxStatus(sdkTransactionInfo.state);
//     }
//
//     // NOTE: if trxInfo is not null, that means transaction was mined or failed
//     if (isSmartAccount && sdkToAppStatus === TX_PENDING_STATUS && trxInfo) {
//       reportLog('Wrong transaction status', {
//         hash,
//         sdkToAppStatus,
//         sdkStatus: sdkTransactionInfo?.state,
//         blockchainStatus: trxInfo.status,
//       });
//       dispatch(transactionUpdate(''));
//       return;
//     }
//
//     // NOTE: when trxInfo is null, that means transaction status is still pending or timed out
//     const stillPending = isSmartAccount
//       ? sdkToAppStatus === TX_PENDING_STATUS
//       : !trxInfo;
//
//     if (stillPending) {
//       dispatch(transactionUpdate(''));
//       return;
//     }
//
//     let gasPrice;
//     let gasUsed;
//     let status;
//     let feeWithGasToken;
//
//     if (isSmartAccount && sdkTransactionInfo) {
//       gasPrice = sdkTransactionInfo.gas.price;
//       gasUsed = sdkTransactionInfo.gas.used;
//       status = sdkToAppStatus;
//
//       // attach gas token info
//       const gasTokenAddress = sdkTransactionInfo.gasToken;
//       const transactionFee = sdkTransactionInfo.fee;
//       if (!isEmpty(gasTokenAddress) && transactionFee) {
//         const supportedAssets = get(getState(), 'assets.supportedAssets', []);
//         const accountAssets = getAssetsAsList(smartAccountAssetsSelector(getState()));
//         const gasToken = getGasTokenDetails(accountAssets, supportedAssets, gasTokenAddress);
//         if (!isEmpty(gasToken)) {
//           feeWithGasToken = parseFeeWithGasToken(gasToken, transactionFee);
//         }
//       }
//     } else if (trxInfo) {
//       ({
//         txInfo: { gasPrice },
//         txReceipt: { gasUsed },
//         status,
//       } = trxInfo);
//     }
//
//     const { history: { data: currentHistory } } = getState();
//     const { updatedHistory } = updateHistoryRecord(
//       currentHistory,
//       hash,
//       (transaction) => ({
//         ...transaction,
//         status,
//         gasPrice: gasPrice ? gasPrice.toNumber() : transaction.gasPrice,
//         gasUsed: gasUsed ? gasUsed.toNumber() : transaction.gasUsed,
//         feeWithGasToken: feeWithGasToken || transaction.feeWithGasToken,
//       }));
//
//     dispatch({
//       type: SET_HISTORY,
//       payload: updatedHistory,
//     });
//
//     dispatch(saveDbAction('history', { history: updatedHistory }, true));
//     dispatch(afterHistoryUpdatedAction());
//     dispatch(fetchAssetsBalancesAction());
//   };
// };

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
