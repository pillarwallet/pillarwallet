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
import { BigNumber as EthersBigNumber } from 'ethers';
import {
  SET_UNIPOOL_DATA,
  SET_UNISWAP_POOL_DATA,
  SET_FETCHING_LIQUIDITY_POOLS_DATA,
  SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR,
  SET_SHOWN_STAKING_ENABLED_MODAL,
} from 'constants/liquidityPoolsConstants';


export type LiquidityPoolsReducerState = {
  unipoolData: {
    [string]: {
      stakedAmount: EthersBigNumber,
      earnedAmount: EthersBigNumber,
    }
  },
  poolsData: {
    [string]: Object,
  },
  isFetchingLiquidityPoolsData: boolean,
  poolDataGraphQueryFailed: boolean,
  shownStakingEnabledModal: {[string]: boolean}
};

export type LiquidityPoolsReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  unipoolData: {},
  poolDataGraphQueryFailed: false,
  isFetchingLiquidityPoolsData: false,
  poolsData: {},
  shownStakingEnabledModal: {},
};

export default function lendingReducer(
  state: LiquidityPoolsReducerState = initialState,
  action: LiquidityPoolsReducerAction,
): LiquidityPoolsReducerState {
  switch (action.type) {
    case SET_FETCHING_LIQUIDITY_POOLS_DATA:
      return { ...state, isFetchingLiquidityPoolsData: action.payload };
    case SET_UNIPOOL_DATA:
      return {
        ...state,
        unipoolData: {
          ...state.unipoolData,
          [action.payload.unipoolAddress]: action.payload.data,
        },
      };
    case SET_UNISWAP_POOL_DATA:
      return {
        ...state,
        poolsData: { ...state.poolsData, [action.payload.poolAddress]: action.payload.data },
        poolDataGraphQueryFailed: false,
      };
    case SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR:
      return { ...state, poolDataGraphQueryFailed: true };
    case SET_SHOWN_STAKING_ENABLED_MODAL:
      return {
        ...state,
        shownStakingEnabledModal: { ...state.shownStakingEnabledModal, [action.payload]: true },
      };
    default:
      return state;
  }
}
