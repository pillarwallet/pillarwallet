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
  SET_FETCHING_UNIPOOL_DATA,
  SET_UNIPOOL_DATA,
  SET_FETCHING_UNISWAP_POOL_DATA,
  SET_UNISWAP_POOL_DATA,
  SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR,
} from 'constants/liquidityPoolsConstants';
import { SET_ESTIMATING_TRANSACTION } from 'constants/transactionEstimateConstants';
import { getStakedAmount, getEarnedAmount, getStakeTransactions, getUnstakeTransaction } from 'utils/unipool';
import {
  getAddLiquidityEthTransactions,
  fetchPoolData,
  getRemoveLiquidityEthTransactions,
} from 'utils/liquidityPools';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { estimateTransactionAction } from 'actions/transactionEstimateActions';
import { GraphQueryError } from 'services/theGraph';
import Toast from 'components/Toast';
import t from 'translations/translate';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';


export const fetchUnipoolUserDataAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_FETCHING_UNIPOOL_DATA, payload: true });
    const [stakedAmount, earnedAmount] = await Promise.all([
      getStakedAmount(getAccountAddress(smartWalletAccount)),
      getEarnedAmount(getAccountAddress(smartWalletAccount)),
    ]).catch(error => {
      reportErrorLog('Unipool service failed', { error });
      return [];
    });

    if (stakedAmount && earnedAmount) {
      dispatch({
        type: SET_UNIPOOL_DATA,
        payload: {
          stakedAmount,
          earnedAmount,
        },
      });
    }
    dispatch({ type: SET_FETCHING_UNIPOOL_DATA, payload: false });
  };
};

export const fetchUniswapPoolDataAction = (poolAddress: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_FETCHING_UNISWAP_POOL_DATA, payload: true });
    const poolData = await fetchPoolData(poolAddress)
      .catch(error => {
        if (error instanceof GraphQueryError) {
          dispatch({
            type: SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR,
          });
        } else {
          reportErrorLog("Liquidity pools service failed: Can't fetch pool data", { error });
          Toast.show({
            message: t('toast.poolDataFetchFailed'),
            emoji: 'hushed',
            supportLink: true,
          });
        }
        return null;
      });
    if (poolData && poolData.pair) {
      dispatch({
        type: SET_UNISWAP_POOL_DATA,
        payload: {
          poolAddress,
          data: poolData.pair,
        },
      });
    }
    dispatch({ type: SET_FETCHING_UNISWAP_POOL_DATA, payload: false });
  };
};

export const calculateAddLiquidityTransactionEthEstimateAction = (
  tokenAmount: number,
  tokenAsset: Asset,
  ethAmount: number,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const addLiquidityTransactions = await getAddLiquidityEthTransactions(
      getAccountAddress(smartWalletAccount),
      tokenAmount,
      tokenAsset,
      ethAmount,
    );

    const sequentialTransactions = addLiquidityTransactions
      .slice(1)
      .map(({
        to: recipient,
        amount: value,
        data,
      }) => ({ recipient, value, data }));

    dispatch(estimateTransactionAction(
      addLiquidityTransactions[0].to,
      addLiquidityTransactions[0].amount,
      addLiquidityTransactions[0].data,
      null,
      sequentialTransactions,
    ));
  };
};

export const calculateStakeTransactionEstimateAction = (
  tokenAmount: number,
  tokenAsset: Asset,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const stakeTransactions = await getStakeTransactions(
      getAccountAddress(smartWalletAccount),
      tokenAmount,
      tokenAsset,
    );

    const sequentialTransactions = stakeTransactions
      .slice(1)
      .map(({
        to: recipient,
        amount: value,
        data,
      }) => ({ recipient, value, data }));

    dispatch(estimateTransactionAction(
      stakeTransactions[0].to,
      stakeTransactions[0].amount,
      stakeTransactions[0].data,
      null,
      sequentialTransactions,
    ));
  };
};

export const calculateUnstakeTransactionEstimateAction = (
  tokenAmount: number,
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const { to, amount, data } = getUnstakeTransaction(
      getAccountAddress(smartWalletAccount),
      tokenAmount,
    );

    dispatch(estimateTransactionAction(to, amount, data));
  };
};

export const calculateRemoveLiquidityTransactionEstimateAction = (
  tokenAmount: number,
  poolToken: Asset,
  erc20Token: Asset,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const removeLiquidityTransactions = await getRemoveLiquidityEthTransactions(
      getAccountAddress(smartWalletAccount),
      tokenAmount,
      poolToken,
      erc20Token,
    );

    const sequentialTransactions = removeLiquidityTransactions
      .slice(1)
      .map(({
        to: recipient,
        amount: value,
        data,
      }) => ({ recipient, value, data }));

    dispatch(estimateTransactionAction(
      removeLiquidityTransactions[0].to,
      removeLiquidityTransactions[0].amount,
      removeLiquidityTransactions[0].data,
      null,
      sequentialTransactions,
    ));
  };
};
