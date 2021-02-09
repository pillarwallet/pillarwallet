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
  SET_RARI_USER_DATA,
  SET_FETCHING_RARI_DATA,
  SET_FETCHING_RARI_DATA_ERROR,
} from 'constants/rariConstants';
import { saveDbAction } from 'actions/dbActions';
import { findFirstEtherspotAccount, getAccountAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { getRariClaimRgtTransaction } from 'utils/rari';
import {
  estimateTransactionAction,
  estimateTransactionsAction,
  setEstimatingTransactionAction,
  setTransactionsEstimateErrorAction,
} from 'actions/transactionEstimateActions';
import Toast from 'components/Toast';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const fetchRariDataAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      rates: { data: rates },
    } = getState();
    const smartWalletAccount = findFirstEtherspotAccount(accounts);
    if (!smartWalletAccount) return;
    const smartWalletAddress = getAccountAddress(smartWalletAccount);

    dispatch({ type: SET_FETCHING_RARI_DATA });

    const [
      userDepositInUSD, userDepositInRariToken, userInterests, rariApy, rariFundBalance, rariTotalSupply,
      userRgtBalance, userUnclaimedRgt, rtgPrice, rtgSupply,
    ] = await Promise.all([
      getAccountDepositInUSD(smartWalletAddress, rates),
      getAccountDepositInPoolToken(smartWalletAddress),
      getUserInterests(smartWalletAddress, rates),
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

    if (userDepositInUSD && userInterests && rariApy && userDepositInRariToken && rariFundBalance &&
        rariTotalSupply && userRgtBalance != null && userUnclaimedRgt != null && rtgPrice && rtgSupply) {
      const payload = {
        userDepositInUSD,
        userDepositInRariToken,
        userInterests,
        rariFundBalance,
        rariTotalSupply,
        userRgtBalance,
        userUnclaimedRgt,
        rtgPrice,
        rtgSupply,
        rariApy,
      };
      dispatch({ type: SET_RARI_USER_DATA, payload });
      dispatch({ type: SET_FETCHING_RARI_DATA_ERROR, payload: false });
      dispatch(saveDbAction('rari', payload));
    }
    dispatch({ type: SET_FETCHING_RARI_DATA, payload: false });
  };
};

export const calculateRariDepositTransactionEstimateAction = (
  rariDepositNeededTransactions: Object[],
) => {
  return (dispatch: Dispatch) => {
    const transactionDrafts = rariDepositNeededTransactions.map(({
      to,
      amount: value,
      data,
    }) => ({ to, value, data }));

    dispatch(estimateTransactionsAction(transactionDrafts));
  };
};

export const calculateRariWithdrawTransactionEstimateAction = (
  rariWithdrawTransaction: Object,
) => {
  return (dispatch: Dispatch) => {
    const { to, amount: value, data } = rariWithdrawTransaction;
    dispatch(estimateTransactionAction({ to, value, data }));
  };
};

export const calculateRariClaimTransactionEstimateAction = (
  claimedAmount: number,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstEtherspotAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch(setEstimatingTransactionAction(true));

    const transaction = await getRariClaimRgtTransaction(
      getAccountAddress(smartWalletAccount),
      claimedAmount,
    );

    if (!transaction) {
      dispatch(setTransactionsEstimateErrorAction(t('toast.transactionFeeEstimationFailed')));
      return;
    }

    const { to, amount: value, data } = transaction;

    dispatch(estimateTransactionAction({ to, value, data }));
  };
};
