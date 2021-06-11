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

// actions
import {
  estimateTransactionAction,
  estimateTransactionsAction,
  setEstimatingTransactionAction,
  setTransactionsEstimateErrorAction,
} from 'actions/transactionEstimateActions';

// components
import Toast from 'components/Toast';

// constants
import {
  SET_FETCHING_LIQUIDITY_POOLS_DATA,
  SET_UNIPOOL_DATA,
  SET_UNISWAP_POOL_DATA,
  SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR,
  SET_SHOWN_STAKING_ENABLED_MODAL,
} from 'constants/liquidityPoolsConstants';
import { LIQUIDITY_POOL_TYPES } from 'models/LiquidityPools';
import { CHAIN } from 'constants/chainConstants';

// utils
import {
  getStakedAmount,
  getEarnedAmount,
} from 'utils/unipool';
import {
  getAddLiquidityTransactions,
  fetchPoolData,
  getRemoveLiquidityTransactions,
  getStakeTransactions,
  getUnstakeTransaction,
  getClaimRewardsTransaction,
} from 'utils/liquidityPools';
import { findFirstArchanovaAccount, getAccountAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';

// services
import { GraphQueryError } from 'services/theGraph';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';
import type { LiquidityPool, UnipoolLiquidityPool } from 'models/LiquidityPools';


const fetchUnipoolUserDataAction = (unipoolAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    const [stakedAmount, earnedAmount] = await Promise.all([
      getStakedAmount(unipoolAddress, getAccountAddress(smartWalletAccount)),
      getEarnedAmount(unipoolAddress, getAccountAddress(smartWalletAccount)),
    ]).catch(error => {
      reportErrorLog('Unipool service failed', { error });
      Toast.show({
        message: t('toast.poolDataFetchFailed'),
        emoji: 'hushed',
        supportLink: true,
      });
      return [];
    });

    if (stakedAmount && earnedAmount) {
      dispatch({
        type: SET_UNIPOOL_DATA,
        payload: {
          unipoolAddress,
          data: {
            stakedAmount,
            earnedAmount,
          },
        },
      });
    }
  };
};

const fetchUniswapPoolDataAction = (poolAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    const poolData = await fetchPoolData(poolAddress, getAccountAddress(smartWalletAccount))
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
    if (poolData) {
      dispatch({
        type: SET_UNISWAP_POOL_DATA,
        payload: {
          poolAddress,
          data: poolData,
        },
      });
    }
  };
};

export const fetchLiquidityPoolsDataAction = (pools: LiquidityPool[]) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_FETCHING_LIQUIDITY_POOLS_DATA, payload: true });
    await Promise.all(pools.map(async pool => {
      if (pool.type === LIQUIDITY_POOL_TYPES.UNIPOOL) {
        await dispatch(fetchUnipoolUserDataAction(pool.unipoolAddress));
      }
      await dispatch(fetchUniswapPoolDataAction(pool.uniswapPairAddress));
    }));
    dispatch({ type: SET_FETCHING_LIQUIDITY_POOLS_DATA, payload: false });
  };
};

export const calculateAddLiquidityTransactionEstimateAction = (
  pool: LiquidityPool,
  tokenAmounts: string[],
  poolTokenAmount: string,
  tokensAssets: Asset[],
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch(setEstimatingTransactionAction(true));

    const addLiquidityTransactions = await getAddLiquidityTransactions(
      getAccountAddress(smartWalletAccount),
      pool,
      tokenAmounts,
      poolTokenAmount,
      tokensAssets,
    ).catch(error => {
      reportErrorLog("Liquidity pools service failed: can't create add liquidity transaction", { error });
      return null;
    });

    if (!addLiquidityTransactions) {
      dispatch(setTransactionsEstimateErrorAction(t('toast.cannotAddLiquidity')));
      return;
    }

    const transactions = addLiquidityTransactions.map(({
      to,
      amount: value,
      data,
    }) => ({ to, value, data }));

    dispatch(estimateTransactionsAction(transactions, CHAIN.ETHEREUM));
  };
};

export const calculateStakeTransactionEstimateAction = (
  pool: UnipoolLiquidityPool,
  tokenAmount: string,
  tokenAsset: Asset,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch(setEstimatingTransactionAction(true));

    const stakeTransactions = await getStakeTransactions(
      pool,
      getAccountAddress(smartWalletAccount),
      tokenAmount,
      tokenAsset,
    ).catch(error => {
      reportErrorLog("Liquidity pools service failed: can't create stake transaction", { error });
      return null;
    });

    if (!stakeTransactions) {
      dispatch(setTransactionsEstimateErrorAction(t('toast.cannotStakeTokens')));
      return;
    }

    const transactions = stakeTransactions.map(({
      to,
      amount: value,
      data,
    }) => ({ to, value, data }));

    dispatch(estimateTransactionsAction(transactions, CHAIN.ETHEREUM));
  };
};

export const calculateUnstakeTransactionEstimateAction = (
  pool: UnipoolLiquidityPool,
  tokenAmount: string,
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch(setEstimatingTransactionAction(true));

    const { to, amount: value, data } = getUnstakeTransaction(
      pool,
      getAccountAddress(smartWalletAccount),
      tokenAmount,
    );

    dispatch(estimateTransactionAction({ to, value, data }, CHAIN.ETHEREUM));
  };
};

export const calculateRemoveLiquidityTransactionEstimateAction = (
  pool: LiquidityPool,
  tokenAmount: string,
  poolToken: Asset,
  tokensAssets: Asset[],
  obtainedTokensAmounts: string[],
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch(setEstimatingTransactionAction(true));

    const removeLiquidityTransactions = await getRemoveLiquidityTransactions(
      getAccountAddress(smartWalletAccount),
      pool,
      tokenAmount,
      poolToken,
      tokensAssets,
      obtainedTokensAmounts,
    ).catch(error => {
      reportErrorLog("Liquidity pools service failed: can't create remove liquidity transaction", { error });
      return null;
    });

    if (!removeLiquidityTransactions) {
      dispatch(setTransactionsEstimateErrorAction(t('toast.cannotRemoveLiquidity')));
      return;
    }

    const transactions = removeLiquidityTransactions.map(({
      to,
      amount: value,
      data,
    }) => ({ to, value, data }));

    dispatch(estimateTransactionsAction(transactions, CHAIN.ETHEREUM));
  };
};

export const calculateClaimRewardsTransactionEstimateAction = (pool: UnipoolLiquidityPool, amountToClaim: number) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch(setEstimatingTransactionAction(true));

    const { to, amount: value, data } = getClaimRewardsTransaction(
      pool,
      getAccountAddress(smartWalletAccount),
      amountToClaim,
    );

    dispatch(estimateTransactionAction({ to, value, data }, CHAIN.ETHEREUM));
  };
};

export const setShownStakingEnabledModalAction = (poolName: string) => (dispatch: Dispatch) => {
  dispatch({ type: SET_SHOWN_STAKING_ENABLED_MODAL, payload: poolName });
};
