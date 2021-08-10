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
import { reportErrorLog } from 'utils/common';
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
    dispatch({ type: SET_TRANSACTION_ESTIMATE_FEE_INFO, payload: null });
    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: null });
    dispatch(setEstimatingTransactionAction(false));
  };
};

export const setEstimatingTransactionAction = (isEstimating: boolean) => ({
  type: SET_ESTIMATING_TRANSACTION,
  payload: isEstimating,
});

export const setTransactionsEstimateFeeAction = (feeInfo: ?TransactionFeeInfo) => {
  return (dispatch: Dispatch) => {
    if (!feeInfo || (feeInfo.fee && !feeInfo.fee.gt(0))) {
      dispatch(setTransactionsEstimateErrorAction(t('toast.transactionFeeEstimationFailed')));
      return;
    }

    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: null });
    dispatch({ type: SET_TRANSACTION_ESTIMATE_FEE_INFO, payload: feeInfo });
    dispatch(setEstimatingTransactionAction(false));
  };
};

export const setTransactionsEstimateErrorAction = (errorMessage: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const currentErrorMessage = getState().transactionEstimate.errorMessage;
    if (currentErrorMessage) Toast.closeAll(); // hide if previous shown

    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: errorMessage });
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
    dispatch(setEstimatingTransactionAction(true));

    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      reportErrorLog('estimateTransactionsAction failed: no active account');
      return;
    }

    const activeAccountAddress = getAccountAddress(activeAccount);

    let transactions;
    try {
      transactions = await Promise.all(transactionsToEstimate.map(({
        to,
        data,
        value,
        assetData,
      }) => buildEthereumTransaction(
        to,
        activeAccountAddress,
        data,
        Number(value).toString(),
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
          etherspotService.clearTransactionsBatch(chain);
        } catch (error) {
          dispatch(setTransactionsEstimateErrorAction(t('toast.transactionFeeEstimationFailed')));
          reportErrorLog('estimateTransactionsAction failed: clear batch was not successful', { error });
          return;
        }

        await etherspotService.setTransactionsBatch(chain, transactions).catch((error) => {
          errorMessage = error?.message;
        });

        estimated = await etherspotService.estimateTransactionsBatch(chain, gasToken?.address).catch((error) => {
          if (!errorMessage) errorMessage = error?.message;
          return null;
        });
        feeInfo = buildEtherspotTxFeeInfo(estimated, useGasToken);
        break;
      case ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET:
        estimated = await archanovaService.estimateAccountTransactions(transactions).catch((error) => {
          errorMessage = error?.message;
          return null;
        });
        feeInfo = buildArchanovaTxFeeInfo(estimated, useGasToken);
        break;
      default:
        reportErrorLog('estimateTransactionsAction failed: unsupported account type', { activeAccount });
        break;
    }

    if (!feeInfo || errorMessage) {
      dispatch(setTransactionsEstimateErrorAction(errorMessage || t('toast.transactionFeeEstimationFailed')));
      return;
    }

    dispatch(setTransactionsEstimateFeeAction(feeInfo));
  };
};

export const estimateTransactionAction = (transaction: TransactionToEstimate, chain: Chain) => {
  return (dispatch: Dispatch) => {
    dispatch(estimateTransactionsAction([transaction], chain));
  };
};
