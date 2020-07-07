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
// constants
import {
  SET_POOL_TOGETHER_PRIZE_INFO,
  SET_EXECUTING_POOL_APPROVE,
  SET_DISMISS_POOL_APPROVE,
  SET_POOL_TOGETHER_ALLOWANCE,
  SET_POOL_TOGETHER_FETCHING_STATS,
} from 'constants/poolTogetherConstants';
import { TX_CONFIRMED_STATUS, TX_FAILED_STATUS } from 'constants/historyConstants';

// components
import Toast from 'components/Toast';

// services
import {
  getPoolTogetherInfo,
  checkPoolAllowance,
} from 'services/poolTogether';

// selectors
import { activeAccountAddressSelector } from 'selectors/selectors';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const fetchPoolPrizeInfo = (symbol: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { poolTogether: { poolStats: currentPoolStats = {} } } = getState();
    const activeAccountAddress = activeAccountAddressSelector(getState());
    dispatch({
      type: SET_POOL_TOGETHER_FETCHING_STATS,
      payload: true,
    });
    const newPoolStats = await getPoolTogetherInfo(symbol, activeAccountAddress);
    if (newPoolStats) {
      const updatedPoolStats = { ...currentPoolStats, [symbol]: newPoolStats };
      dispatch({
        type: SET_POOL_TOGETHER_PRIZE_INFO,
        payload: updatedPoolStats,
      });
    }
    dispatch({
      type: SET_POOL_TOGETHER_FETCHING_STATS,
      payload: false,
    });
  };
};

export const setExecutingApproveAction = (poolToken: string, txHash: string) => ({
  type: SET_EXECUTING_POOL_APPROVE,
  payload: { poolToken, txHash },
});

export const setDismissApproveAction = (poolToken: string) => ({
  type: SET_DISMISS_POOL_APPROVE,
  payload: poolToken,
});

export const fetchPoolAllowanceStatusAction = (symbol: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      poolTogether: {
        poolAllowance: currentPoolAllowance = {},
      },
    } = getState();
    const activeAccountAddress = activeAccountAddressSelector(getState());
    const hasAllowance = await checkPoolAllowance(symbol, activeAccountAddress);
    if (hasAllowance !== null) {
      const updatedAllowance = { ...currentPoolAllowance, [symbol]: hasAllowance };
      dispatch({
        type: SET_POOL_TOGETHER_ALLOWANCE,
        payload: updatedAllowance,
      });
      if (hasAllowance) {
        dispatch(setDismissApproveAction(symbol));
      }
    }
  };
};

export const checkPoolTogetherApprovalTransactionAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      history: {
        data: transactionsHistory,
      },
      poolTogether: {
        poolApproveExecuting,
      },
    } = getState();
    Object.keys(poolApproveExecuting).forEach((symbol: string) => {
      const txHash = poolApproveExecuting[symbol];
      if (txHash) {
        const accountIds = Object.keys(transactionsHistory);
        const allHistory: Object[] = accountIds.reduce(
          (existing = [], accountId) => {
            const walletAssetsHistory = transactionsHistory[accountId] || [];
            return [...existing, ...walletAssetsHistory];
          },
          [],
        );
        const allowanceTransaction = allHistory.find(({ hash = null }) => hash === txHash);
        if (allowanceTransaction) {
          if (allowanceTransaction.status === TX_CONFIRMED_STATUS) {
            dispatch(fetchPoolAllowanceStatusAction(symbol));
            Toast.show({
              message: `PoolTogether ${symbol} Pool automation was enabled`,
              type: 'success',
              title: 'Success',
              autoClose: true,
            });
          } else if (allowanceTransaction.status === TX_FAILED_STATUS) {
            dispatch(setDismissApproveAction(symbol));
            Toast.show({
              message: `PoolTogether ${symbol} Pool automation transaction failed`,
              type: 'warning',
              title: 'Transaction failed',
              autoClose: true,
            });
          }
        }
      }
    });
  };
};
