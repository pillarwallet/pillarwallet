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
import { SET_FETCHING_UNIPOOL_DATA, SET_UNIPOOL_DATA } from 'constants/liquidityPoolsConstants';


export type LiquidityPoolsReducerState = {
  isFetchingUnipoolData: boolean,
  unipool: {
    stakedAmount: EthersBigNumber,
    earnedAmount: EthersBigNumber,
  }
};

export type LiquidityPoolsReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  isFetchingUnipoolData: false,
  unipool: {
    stakedAmount: EthersBigNumber.from(0),
    earnedAmount: EthersBigNumber.from(0),
  },
};

export default function lendingReducer(
  state: LiquidityPoolsReducerState = initialState,
  action: LiquidityPoolsReducerAction,
): LiquidityPoolsReducerState {
  switch (action.type) {
    case SET_FETCHING_UNIPOOL_DATA:
      return { ...state, isFetchingUnipoolData: action.payload };
    case SET_UNIPOOL_DATA:
      return { ...state, unipool: action.payload };
    default:
      return state;
  }
}
