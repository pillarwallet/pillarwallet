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
} from 'constants/poolTogetherConstants';

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
    const newPoolStats = await getPoolTogetherInfo(symbol);
    const updatedPoolStats = { ...currentPoolStats, [symbol]: newPoolStats };
    dispatch({
      type: SET_POOL_TOGETHER_PRIZE_INFO,
      payload: updatedPoolStats,
    });
  };
};

export const fetchPoolAllowanceStatusAction = (symbol: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      poolTogether: {
        poolAllowance: currentPoolAllowance = {},
      },
    } = getState();
    const activeAccountAddress = activeAccountAddressSelector(getState());
    const hasAllowance = await checkPoolAllowance(symbol, activeAccountAddress);
    const updatedAllowance = { ...currentPoolAllowance, [symbol]: hasAllowance };
    dispatch({
      type: SET_POOL_TOGETHER_ALLOWANCE,
      payload: updatedAllowance,
    });
  };
};

export const setExecutingApproveAction = (poolToken: string) => ({
  type: SET_EXECUTING_POOL_APPROVE,
  payload: poolToken,
});

export const setDismissApproveAction = (poolToken: string) => ({
  type: SET_DISMISS_POOL_APPROVE,
  payload: poolToken,
});
