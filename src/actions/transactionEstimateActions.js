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

// services
import smartWalletService from 'services/smartWallet';

// utils
import { buildTxFeeInfo } from 'utils/smartWallet';

// selectors
import { useGasTokenSelector } from 'selectors/smartWallet';

// constants
import {
  RESET_TRANSACTION_ESTIMATE,
  SET_ESTIMATING_TRANSACTION,
  SET_TRANSACTION_ESTIMATE,
  SET_TRANSACTION_ESTIMATE_ERROR,
} from 'constants/transactionEstimateConstants';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { AccountTransaction } from 'services/smartWallet';
import type { AssetData } from 'models/Asset';


export const estimateTransactionAction = (
  transaction: AccountTransaction,
  assetData?: AssetData,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });
    dispatch({ type: RESET_TRANSACTION_ESTIMATE });

    let errorMessage;
    let feeInfo;

    const estimated = await smartWalletService
      .estimateAccountTransaction(transaction, assetData)
      .catch((sdkError) => {
        console.log('sdkError: ', sdkError);
        errorMessage = sdkError || t('toast.transactionFeeEstimationFailed');
        return null;
      });

    if (!errorMessage) {
      const useGasToken = useGasTokenSelector(getState());
      feeInfo = buildTxFeeInfo(estimated, useGasToken)
    }

    if (feeInfo && !feeInfo.fee.gt(0)) {
      errorMessage = 'estimate below 0';
    }

    if (errorMessage) {
      Toast.show({
        message: errorMessage,
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: errorMessage });
      return;
    }

    console.log('feeInfo: ', feeInfo)

    dispatch({ type: SET_TRANSACTION_ESTIMATE, payload: { raw: estimated, feeInfo } });

    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: false });
  };
};
