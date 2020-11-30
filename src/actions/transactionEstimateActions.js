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
import { utils } from 'ethers';

// components
import Toast from 'components/Toast';

// services
import etherspot from 'services/etherspot';
import { buildERC721TransactionData } from 'services/assets';

// utils
import { buildTxFeeInfo } from 'utils/etherspot';
import { reportErrorLog } from 'utils/common';

// selectors
import { useGasTokenSelector } from 'selectors/smartWallet';
import { activeAccountAddressSelector } from 'selectors';

// constants
import {
  SET_ESTIMATING_TRANSACTION,
  SET_TRANSACTION_ESTIMATE_FEE_INFO,
  SET_TRANSACTION_ESTIMATE_ERROR,
} from 'constants/transactionEstimateConstants';
import { COLLECTIBLES, ETH } from 'constants/assetsConstants';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { TransactionDraft } from 'models/Transaction';
import type { EtherspotTransaction } from 'models/Etherspot';


export const resetEstimateTransactionAction = () => {
  return (dispatch: Dispatch) => {
    dispatch({ type: SET_TRANSACTION_ESTIMATE_FEE_INFO, payload: null });
    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: null });
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: false });
  };
};

export const estimateTransactionsAction = (transactions: TransactionDraft[]) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    // reset batch, not a promise
    try {
      etherspot.clearTransactionsBatch();
    } catch (error) {
      dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: t('toast.transactionFeeEstimationFailed') });
      reportErrorLog('estimateTransactionsAction failed: clear batch was not successful', { error });
      return;
    }

    const activeAccountAddress = activeAccountAddressSelector(getState());

    const etherspotTransactions: EtherspotTransaction[] = await Promise.all(
      transactions.map(async (transactionDraft) => {
        const { to, assetData } = transactionDraft;
        let { data, value } = transactionDraft;

        if (assetData && assetData.token !== ETH) {
          switch (assetData.tokenType) {
            case COLLECTIBLES:
              const {
                name,
                id,
                contractAddress,
                tokenType,
              } = assetData;
              data = await buildERC721TransactionData({
                from: activeAccountAddress,
                to,
                name,
                tokenId: id,
                contractAddress,
                tokenType,
              });
              value = 0;
              break;
            default: break;
          }
        } else if (!assetData || assetData.token === ETH) {
          value = utils.parseEther(value.toString());
        }

        return { to, value, data };
      }),
    );

    let errorMessage;
    let feeInfo;

    await etherspot.setTransactionsBatch(etherspotTransactions).catch((error) => {
      errorMessage = error?.message || t('toast.transactionFeeEstimationFailed');
    });

    const estimated = await etherspot.estimateTransactionsBatch().catch((error) => {
      errorMessage = error?.message
        ? t('toast.failedToEstimateTransactionWithMessage', { message: error.message })
        : t('toast.transactionFeeEstimationFailed');
      return null;
    });

    if (!errorMessage) {
      const useGasToken = useGasTokenSelector(getState());
      feeInfo = buildTxFeeInfo(estimated, useGasToken);
    }

    if (!errorMessage && feeInfo && feeInfo.fee && !feeInfo.fee.gt(0)) {
      errorMessage = t('toast.transactionFeeEstimationFailed');
    }

    const currentErrorMessage = getState().transactionEstimate.errorMessage;
    if (errorMessage) {
      dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: errorMessage });
      if (currentErrorMessage) Toast.closeAll(); // hide if previous shown
      Toast.show({
        message: errorMessage,
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: null });
    dispatch({ type: SET_TRANSACTION_ESTIMATE_FEE_INFO, payload: feeInfo });
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: false });
  };
};

export const estimateTransactionAction = (transaction: TransactionDraft) => {
  return (dispatch: Dispatch) => {
    dispatch(estimateTransactionsAction([transaction]));
  };
};
