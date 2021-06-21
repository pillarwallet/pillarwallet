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
import {
  getRariFundBalanceInUSD,
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

// constants
import {
  SET_RARI_USER_DATA,
  SET_FETCHING_RARI_DATA,
  SET_FETCHING_RARI_DATA_ERROR,
} from 'constants/rariConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { saveDbAction } from 'actions/dbActions';
import {
  estimateTransactionAction,
  estimateTransactionsAction,
  setEstimatingTransactionAction,
  setTransactionsEstimateErrorAction,
} from 'actions/transactionEstimateActions';

// utils
import { findFirstArchanovaAccount, getAccountAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { getRariClaimRgtTransaction } from 'utils/rari';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const fetchRariDataAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      rates: { data: ratesPerChain },
    } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;
    const smartWalletAddress = getAccountAddress(smartWalletAccount);

    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};

    dispatch({ type: SET_FETCHING_RARI_DATA });

    const [
      userDepositInUSD, userDepositInRariToken, userInterests, rariFundBalance, rariTotalSupply,
      userRgtBalance, userUnclaimedRgt, rtgPrice, rtgSupply,
    ] = await Promise.all([
      getAccountDepositInUSD(smartWalletAddress, ethereumRates),
      getAccountDepositInPoolToken(smartWalletAddress),
      getUserInterests(smartWalletAddress, ethereumRates),
      getRariFundBalanceInUSD(ethereumRates),
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

    if (userDepositInUSD && userInterests && userDepositInRariToken && rariFundBalance &&
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
    dispatch(setEstimatingTransactionAction(true));

    const transactions = rariDepositNeededTransactions.map(({
      to,
      amount: value,
      data,
    }) => ({ to, value, data }));

    dispatch(estimateTransactionsAction(transactions, CHAIN.ETHEREUM));
  };
};

export const calculateRariWithdrawTransactionEstimateAction = (
  rariWithdrawTransaction: Object,
) => {
  return (dispatch: Dispatch) => {
    dispatch(setEstimatingTransactionAction(true));

    const { to, amount: value, data } = rariWithdrawTransaction;

    dispatch(estimateTransactionAction({ to, value, data }, CHAIN.ETHEREUM));
  };
};

export const calculateRariClaimTransactionEstimateAction = (
  claimedAmount: number,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
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

    dispatch(estimateTransactionAction({ to, value, data }, CHAIN.ETHEREUM));
  };
};
