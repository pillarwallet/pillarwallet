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
import { getPlrAddressForChain } from 'configs/assetsConfig';

// components
import Toast from 'components/Toast';

// services
import archanovaService from 'services/archanova';
import etherspotService from 'services/etherspot';

// utils
import { reportErrorLog, logBreadcrumb } from 'utils/common';
import { buildArchanovaTxFeeInfo } from 'utils/archanova';
import { buildEthereumTransaction } from 'utils/transactions';
import { buildEtherspotTxFeeInfo } from 'utils/etherspot';
import { getAccountAddress, getAccountType } from 'utils/accounts';
import { findAssetByAddress } from 'utils/assets';

// selectors
import { activeAccountSelector, supportedAssetsPerChainSelector } from 'selectors';
import { preferredGasTokenSelector, useGasTokenSelector } from 'selectors/archanova';

// constants
import {
  SET_ESTIMATING_TRANSACTION,
  SET_TRANSACTION_ESTIMATE_FEE_INFO,
  SET_TRANSACTION_ESTIMATE_ERROR,
} from 'constants/transactionEstimateConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { PLR } from 'constants/assetsConstants';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { TransactionFeeInfo, TransactionToEstimate } from 'models/Transaction';
import type { Chain } from 'models/Chain';


export const resetEstimateTransactionAction = () => {
  return (dispatch: Dispatch) => {
    logBreadcrumb(
      'Send Flow',
      'resetEstimateTransactionAction: dispatching SET_TRANSACTION_ESTIMATE_FEE_INFO',
    );
    dispatch({ type: SET_TRANSACTION_ESTIMATE_FEE_INFO, payload: null });
    logBreadcrumb(
      'Send Flow',
      'resetEstimateTransactionAction: dispatching SET_TRANSACTION_ESTIMATE_ERROR',
    );
    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: null });
    logBreadcrumb(
      'Send Flow',
      'resetEstimateTransactionAction: dispatching setEstimatingTransactionAction as false',
    );
    dispatch(setEstimatingTransactionAction(false));
  };
};

export const setEstimatingTransactionAction = (isEstimating: boolean) => ({
  type: SET_ESTIMATING_TRANSACTION,
  payload: isEstimating,
});

export const setTransactionsEstimateFeeAction = (feeInfo: ?TransactionFeeInfo) => {
  return (dispatch: Dispatch) => {
    if (!feeInfo || (feeInfo.fee && !feeInfo.fee.gte(0))) {
      logBreadcrumb(
        'Send Flow',
        'setTransactionsEstimateFeeAction: dispatching setTransactionsEstimateErrorAction',
        t('toast.transactionFeeEstimationFailed'),
      );
      dispatch(setTransactionsEstimateErrorAction(t('toast.transactionFeeEstimationFailed')));
      return;
    }

    logBreadcrumb(
      'Send Flow',
      'setTransactionsEstimateFeeAction: dispatching SET_TRANSACTION_ESTIMATE_ERROR',
    );
    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: null });
    logBreadcrumb(
      'Send Flow',
      'setTransactionsEstimateFeeAction: dispatching SET_TRANSACTION_ESTIMATE_FEE_INFO',
      { feeInfo },
    );
    dispatch({ type: SET_TRANSACTION_ESTIMATE_FEE_INFO, payload: feeInfo });
    logBreadcrumb(
      'Send Flow',
      'setTransactionsEstimateFeeAction: dispatching setEstimatingTransactionAction as false',
    );
    dispatch(setEstimatingTransactionAction(false));
  };
};

export const setTransactionsEstimateErrorAction = (errorMessage: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    logBreadcrumb(
      'Send Flow',
      'setTransactionsEstimateErrorAction: fetching transaction estimate error message',
      { errorMessage },
    );
    const currentErrorMessage = getState().transactionEstimate.errorMessage;
    if (currentErrorMessage) Toast.closeAll(); // hide if previous shown
    logBreadcrumb(
      'Send Flow',
      'setTransactionsEstimateErrorAction: dispatching SET_TRANSACTION_ESTIMATE_ERROR',
      { errorMessage },
    );
    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: errorMessage });

    logBreadcrumb(
      'Send Flow',
      'setTransactionsEstimateErrorAction: dispatching setEstimatingTransactionAction as false',
    );
    dispatch(setEstimatingTransactionAction(false));

    Toast.show({
      message: errorMessage,
      emoji: 'woman-shrugging',
      supportLink: true,
    });
  };
};

export const estimateTransactionsAction = (
  transactionsToEstimate: TransactionToEstimate[],
  chain: Chain,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    logBreadcrumb(
      'Send Flow',
      'estimateTransactionsAction: dispatching setEstimatingTransactionAction as true',
    );
    dispatch(setEstimatingTransactionAction(true));

    logBreadcrumb(
      'Send Flow',
      'estimateTransactionsAction: checking for active account',
    );
    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      reportErrorLog('estimateTransactionsAction failed: no active account');
      return;
    }

    const activeAccountAddress = getAccountAddress(activeAccount);

    let transactions;
    try {
      logBreadcrumb('Send Flow', 'estimateTransactionsAction: building transaction', {
        transactionsToEstimate, chain,
      });
      transactions = await Promise.all(transactionsToEstimate.map(({
        to,
        data,
        value,
        assetData,
      }) => buildEthereumTransaction(
        to,
        activeAccountAddress,
        data,
        value.toString(),
        assetData?.token,
        assetData?.decimals,
        assetData?.tokenType,
        assetData?.contractAddress,
        assetData?.id,
        chain,
        assetData?.isLegacy,
      )));
    } catch (error) {
      dispatch(setTransactionsEstimateErrorAction(t('toast.transactionFeeEstimationFailed')));
      reportErrorLog('estimateTransactionsAction failed: failed building transactions', {
        transactionsToEstimate,
        error,
      });
      return;
    }

    const useGasToken = useGasTokenSelector(getState());

    const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());
    const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];

    const gasTokenAddress = preferredGasTokenSelector(getState()) === PLR ? getPlrAddressForChain(chain) : null;
    const gasToken = useGasToken && gasTokenAddress ? findAssetByAddress(chainSupportedAssets, gasTokenAddress) : null;

    let errorMessage;
    let estimated;
    let feeInfo;

    switch (getAccountType(activeAccount)) {
      case ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET:
        // reset batch, not a promise
        try {
          logBreadcrumb('Send Flow', 'account type: etherspot smart wallet clearTransactionsBatch', {
            chain,
          });
          etherspotService.clearTransactionsBatch(chain);
        } catch (error) {
          dispatch(setTransactionsEstimateErrorAction(t('toast.transactionFeeEstimationFailed')));
          reportErrorLog('estimateTransactionsAction failed: clear batch was not successful', { error });
          return;
        }

        logBreadcrumb('Send Flow', 'account type: etherspot smart wallet, setTransactionsBatch', {
          chain,
          transactions,
        });
        await etherspotService.setTransactionsBatch(chain, transactions).catch((error) => {
          reportErrorLog('estimateTransactionsAction failed: failed to setTransactionsBatch', { error });
          errorMessage = error?.message;
        });

        logBreadcrumb('Send Flow', 'account type: etherspot smart wallet, estimateTransactionsBatch', {
          chain,
        });
        estimated = await etherspotService.estimateTransactionsBatch(chain, gasToken?.address).catch((error) => {
          reportErrorLog('estimateTransactionsAction failed: failed to estimateTransactionsBatch', { error });
          if (!errorMessage) errorMessage = error?.message;
          return null;
        });
        logBreadcrumb('Send Flow', 'account type: etherspot smart wallet, buildEtherspotTxFeeInfo', {
          estimated, useGasToken,
        });
        feeInfo = buildEtherspotTxFeeInfo(estimated, useGasToken);
        break;
      case ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET:
        logBreadcrumb('Send Flow', 'account type: archanvova smart wallet, estimateAccountTransactions', {
          transactions,
        });
        estimated = await archanovaService.estimateAccountTransactions(transactions).catch((error) => {
          reportErrorLog('estimateTransactionsAction failed: failed to estimate account transaction', { error });
          errorMessage = error?.message;
          return null;
        });
        logBreadcrumb('Send Flow', 'account type: archanvova smart wallet, buildEtherspotTxFeeInfo', {
          estimated, useGasToken,
        });
        feeInfo = buildArchanovaTxFeeInfo(estimated, useGasToken);
        break;
      default:
        reportErrorLog('estimateTransactionsAction failed: unsupported account type', { activeAccount });
        break;
    }

    if (!feeInfo || errorMessage) {
      logBreadcrumb(
        'Send Flow',
        'estimateTransactionsAction: dispatching setTransactionsEstimateErrorAction',
        t('toast.transactionFeeEstimationFailed'),
      );
      dispatch(setTransactionsEstimateErrorAction(errorMessage || t('toast.transactionFeeEstimationFailed')));
      return;
    }
    logBreadcrumb(
      'Send Flow',
      'estimateTransactionsAction: dispatching setTransactionsEstimateFeeAction',
      { feeInfo },
    );
    dispatch(setTransactionsEstimateFeeAction(feeInfo));
  };
};

export const estimateTransactionAction = (transaction: TransactionToEstimate, chain: Chain) => {
  return (dispatch: Dispatch) => {
    logBreadcrumb(
      'Send Flow',
      'estimateTransactionAction: dispatching estimateTransactionsAction',
      { transaction, chain },
    );
    dispatch(estimateTransactionsAction([transaction], chain));
  };
};
