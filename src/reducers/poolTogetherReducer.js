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
import { SET_POOL_TOGETHER_PRIZE_INFO } from 'constants/poolTogetherConstants';

type PoolTogetherPrizeInfo = {
  currentPrize: string,
  prizeEstimate: string,
  drawDate: number,
  remainingTimeMs: number,
  totalPoolTicketsCount: number,
};

export type PoolTogetherReducerState = {
  poolStats: {
    [string]: PoolTogetherPrizeInfo,
  }
}

export type PoolTogetherReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  poolStats: {
    DAI: {
      currentPrize: '0',
      prizeEstimate: '0',
      drawDate: 0,
      remainingTimeMs: 0,
      totalPoolTicketsCount: 0,
    },
    USDC: {
      currentPrize: '0',
      prizeEstimate: '0',
      drawDate: 0,
      remainingTimeMs: 0,
      totalPoolTicketsCount: 0,
    },
  },
};

export default function poolTogetherReducer(
  state: PoolTogetherReducerState = initialState,
  action: PoolTogetherReducerAction,
): PoolTogetherReducerState {
  switch (action.type) {
    case SET_POOL_TOGETHER_PRIZE_INFO:
      return {
        ...state,
        poolStats: action.payload,
      };
    default:
      return state;
  }
}
