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
import { buildERC721TransactionData } from 'services/assets';

// utils
import { buildTxFeeInfo } from 'utils/smartWallet';
import { getEthereumProvider } from 'utils/common';

// config
import { getEnv } from 'configs/envConfig';

// selectors
import { useGasTokenSelector } from 'selectors/smartWallet';
import { activeAccountAddressSelector } from 'selectors';

// constants
import {
  SET_ESTIMATING_TRANSACTION,
  SET_TRANSACTION_ESTIMATE_FEE_INFO,
  SET_TRANSACTION_ESTIMATE_ERROR,
} from 'constants/transactionEstimateConstants';
import { COLLECTIBLES } from 'constants/assetsConstants';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { AccountTransaction } from 'services/smartWallet';
import type { AssetData } from 'models/Asset';


export const resetEstimateTransactionAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_TRANSACTION_ESTIMATE_FEE_INFO, payload: null });
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: false });
  };
};

export const estimateTransactionAction = (
  recipientAddress: string,
  value: number,
  data: ?string,
  assetData: ?AssetData,
  sequential: ?AccountTransaction[],
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const activeAccountAddress = activeAccountAddressSelector(getState());

    let transaction: AccountTransaction = {
      recipient: recipientAddress,
      value,
      sequential,
    };

    if (assetData?.tokenType === COLLECTIBLES && !data && assetData) {
      const provider = getEthereumProvider(getEnv().COLLECTIBLES_NETWORK);
      const {
        name,
        id,
        contractAddress,
        tokenType,
      } = assetData;
      const collectibleTransaction = {
        from: activeAccountAddress,
        to: recipientAddress,
        name,
        tokenId: id,
        contractAddress,
        tokenType,
      };
      data = await buildERC721TransactionData(collectibleTransaction, provider);
    }
    if (data) {
      transaction = { ...transaction, data };
    }

    let errorMessage;
    let feeInfo;

    const estimated = await smartWalletService
      .estimateAccountTransaction(transaction, assetData)
      .catch((error) => {
        errorMessage = error?.message || t('toast.transactionFeeEstimationFailed');
        return null;
      });

    if (!errorMessage) {
      const useGasToken = useGasTokenSelector(getState());
      feeInfo = buildTxFeeInfo(estimated, useGasToken);
    }

    if (!errorMessage && feeInfo && !feeInfo.fee.gt(0)) {
      errorMessage = t('toast.transactionFeeEstimationFailed');
    }

    const currentErrorMessage = getState().transactionEstimate.errorMessage;
    if (errorMessage) {
      dispatch({ type: SET_TRANSACTION_ESTIMATE_ERROR, payload: errorMessage });
      // TODO: Toast is temporary solution
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
