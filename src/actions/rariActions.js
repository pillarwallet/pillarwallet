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
import {
  getRariFundBalanceInUSD,
  getRariAPY,
  getUserInterests,
  getAccountDepositInUSD,
  getAccountDepositInPoolToken,
  getRariTokenTotalSupply,
  getUserRgtBalance,
  getUnclaimedRgt,
  getRtgPrice,
  getRtgSupply,
} from 'services/rari';
import { GraphQueryError } from 'services/theGraph';
import t from 'translations/translate';
import {
  SET_RARI_APY,
  SET_RARI_USER_DATA,
  SET_FETCHING_RARI_DATA,
  SET_FETCHING_RARI_DATA_ERROR,
} from 'constants/rariConstants';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { getRariClaimRgtTransaction } from 'utils/rari';
import { estimateTransactionAction, setEstimatingTransactionAction } from 'actions/transactionEstimateActions';
import Toast from 'components/Toast';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const fetchRariDataAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      rates: { data: rates },
    } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const smartWalletAddress = getAccountAddress(smartWalletAccount);

    dispatch({ type: SET_FETCHING_RARI_DATA });

    const [
      userDepositInUSD, userDepositInRariToken, userInterests, rariAPY, rariFundBalance, rariTotalSupply,
      userRgtBalance, userUnclaimedRgt, rtgPrice, rtgSupply,
    ] = await Promise.all([
      getAccountDepositInUSD(smartWalletAddress),
      getAccountDepositInPoolToken(smartWalletAddress),
      getUserInterests(smartWalletAddress),
      getRariAPY(),
      getRariFundBalanceInUSD(rates),
      getRariTokenTotalSupply(),
      getUserRgtBalance(smartWalletAddress),
      getUnclaimedRgt(smartWalletAddress),
      getRtgPrice(),
      getRtgSupply(),
    ]).catch(error => {
      if (error instanceof GraphQueryError) {
        dispatch({ type: SET_FETCHING_RARI_DATA_ERROR });
      } else {
        reportErrorLog('Rari service failed: Error fetching rari data', { error });
        Toast.show({
          message: t('toast.rariFetchDataFailed'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
      }
      return [];
    });

    if (userDepositInUSD && userInterests && rariAPY && userDepositInRariToken && rariFundBalance &&
        rariTotalSupply && userRgtBalance != null && userUnclaimedRgt != null && rtgPrice && rtgSupply) {
      dispatch({
        type: SET_RARI_USER_DATA,
        payload: {
          userDepositInUSD,
          userDepositInRariToken,
          userInterests,
          rariFundBalance,
          rariTotalSupply,
          userRgtBalance,
          userUnclaimedRgt,
          rtgPrice,
          rtgSupply,
        },
      });
      dispatch({ type: SET_RARI_APY, payload: rariAPY });
      dispatch({ type: SET_FETCHING_RARI_DATA_ERROR, payload: false });
    }
    dispatch({ type: SET_FETCHING_RARI_DATA, payload: false });
  };
};

export const calculateRariDepositTransactionEstimateAction = (
  rariDepositNeededTransactions: Object[],
) => {
  return (dispatch: Dispatch) => {
    dispatch(setEstimatingTransactionAction(true));
    const sequentialTransactions = rariDepositNeededTransactions
      .slice(1)
      .map(({
        to: recipient,
        amount: value,
        data,
      }) => ({ recipient, value, data }));

    dispatch(estimateTransactionAction(
      rariDepositNeededTransactions[0].to,
      rariDepositNeededTransactions[0].amount,
      rariDepositNeededTransactions[0].data,
      null,
      sequentialTransactions,
    ));
  };
};

export const calculateRariWithdrawTransactionEstimateAction = (
  rariWithdrawTransaction: Object,
) => {
  return (dispatch: Dispatch) => {
    dispatch(setEstimatingTransactionAction(true));

    dispatch(estimateTransactionAction(
      rariWithdrawTransaction.to,
      rariWithdrawTransaction.amount,
      rariWithdrawTransaction.data,
    ));
  };
};

export const calculateRariClaimTransactionEstimateAction = (
  claimedAmount: number,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch(setEstimatingTransactionAction(true));

    const { to, amount, data } = await getRariClaimRgtTransaction(
      getAccountAddress(smartWalletAccount),
      claimedAmount,
    );

    dispatch(estimateTransactionAction(to, amount, data));
  };
};
