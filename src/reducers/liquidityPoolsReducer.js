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
import { UPDATE_POOL_DATA, SET_FETCHING_POOL_DATA } from 'constants/liquidityPoolsConstants';
import type { PoolData } from 'models/LiquidityPools';


export type LiquidityPoolsReducerState = {
  poolsData: {[address: string]: PoolData},
  isFetchingPoolData: boolean,
};

export type LiquidityPoolsReducerAction = {
  type: string,
  payload: Object,
};

export const initialState: LiquidityPoolsReducerState = {
  poolsData: {},
  isFetchingPoolData: false,
};

const liquidityPoolsReducer = (
  state: LiquidityPoolsReducerState = initialState,
  action: LiquidityPoolsReducerAction,
): LiquidityPoolsReducerState => {
  switch (action.type) {
    case SET_FETCHING_POOL_DATA:
      return { ...state, isFetchingPoolData: action.payload };
    case UPDATE_POOL_DATA:
      const { poolAddress, poolData } = action.payload;
      return { ...state, poolsData: { ...state.poolsData, [poolAddress]: poolData }, isFetchingPoolData: false };
    default:
      return state;
  }
};

export default liquidityPoolsReducer;
