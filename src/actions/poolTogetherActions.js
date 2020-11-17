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
  SET_POOL_TOGETHER_GRAPH_QUERY_ERROR,
} from 'constants/poolTogetherConstants';
import { TX_CONFIRMED_STATUS, TX_FAILED_STATUS } from 'constants/historyConstants';
import { DAI, USDC } from 'constants/assetsConstants';
import t from 'translations/translate';

// components
import Toast from 'components/Toast';

// services
import {
  getPoolTogetherInfo,
  checkPoolAllowance,
} from 'services/poolTogether';
import { GraphQueryError } from 'services/theGraph';

// selectors
import { activeAccountAddressSelector } from 'selectors/selectors';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const fetchPoolPrizeInfo = (symbol: string, sequence?: boolean) => { // sequence calls in rare sync events
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      poolTogether: {
        poolStats: currentPoolStats = {},
        lastSynced = {},
        isFetchingPoolStats = false,
        poolStatsGraphQueryFailed,
      },
    } = getState();
    const activeAccountAddress = activeAccountAddressSelector(getState());
    if (isFetchingPoolStats && !sequence) return;
    dispatch({
      type: SET_POOL_TOGETHER_FETCHING_STATS,
      payload: true,
    });

    if (poolStatsGraphQueryFailed || Date.now() - 15000 > lastSynced[symbol]) {
      const newPoolStats = await getPoolTogetherInfo(symbol, activeAccountAddress)
        .catch(error => {
          if (error instanceof GraphQueryError) {
            dispatch({
              type: SET_POOL_TOGETHER_GRAPH_QUERY_ERROR,
              payload: { symbol },
            });
          }

          return null;
        });

      if (newPoolStats) {
        const updatedPoolStats = { ...currentPoolStats, [symbol]: newPoolStats };
        dispatch({
          type: SET_POOL_TOGETHER_PRIZE_INFO,
          payload: { updatedPoolStats, symbol },
        });
      }
    }
    dispatch({
      type: SET_POOL_TOGETHER_FETCHING_STATS,
      payload: false,
    });
  };
};

export const fetchAllPoolsPrizes = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      poolTogether: {
        isFetchingPoolStats = false,
      },
    } = getState();
    if (!isFetchingPoolStats) {
      await dispatch(fetchPoolPrizeInfo(DAI));
      await dispatch(fetchPoolPrizeInfo(USDC, true));
    }
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
              message: t('toast.poolTogetherAutomationEnabled', { tokenSymbol: symbol }),
              emoji: 'ok_hand',
              autoClose: true,
            });
          } else if (allowanceTransaction.status === TX_FAILED_STATUS) {
            dispatch(setDismissApproveAction(symbol));
            Toast.show({
              message: t('toast.poolTogetherAutomationFailed', { tokenSymbol: symbol }),
              emoji: 'hushed',
              supportLink: true,
              autoClose: true,
            });
          }
        }
      }
    });
  };
};
