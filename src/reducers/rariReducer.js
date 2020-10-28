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
  SET_RARI_FUND_BALANCE,
  SET_RARI_APY,
  SET_RARI_USER_DATA,
  SET_FETCHING_RARI_FUND_BALANCE,
  SET_FETCHING_RARI_APY,
  SET_FETCHING_RARI_USER_DATA,
} from 'constants/rariConstants';

export type RariReducerState = {
  rariFundBalance: number,
  rariApy: number,
  rariUserData: {
    userDepositInUSD: number,
    userDepositInRSPT: number,
    userInterests: number,
    userInterestsPercentage: number,
  },
  isFetchingFundBalance: boolean,
  isFetchingRariAPY: boolean,
  isFetchingRariUserData: boolean,
}

export type RariReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  rariFundBalance: 0,
  rariApy: 0,
  rariUserData: {
    userDepositInUSD: 0,
    userDepositInRSPT: 0,
    userInterests: 0,
    userInterestsPercentage: 0,
  },
  isFetchingFundBalance: false,
  isFetchingRariAPY: false,
  isFetchingRariUserData: false,
};

export default function rariReducer(
  state: RariReducerState = initialState,
  action: RariReducerAction,
): RariReducerState {
  switch (action.type) {
    case SET_RARI_FUND_BALANCE:
      return {
        ...state,
        rariFundBalance: action.payload,
        isFetchingFundBalance: false,
      };
    case SET_RARI_APY:
      return {
        ...state,
        rariApy: action.payload,
        isFetchingRariAPY: false,
      };
    case SET_RARI_USER_DATA:
      return {
        ...state,
        rariUserData: action.payload,
        isFetchingRariUserData: false,
      };
    case SET_FETCHING_RARI_FUND_BALANCE:
      return {
        ...state,
        isFetchingFundBalance: action.payload ?? true,
      };
    case SET_FETCHING_RARI_APY:
      return {
        ...state,
        isFetchingRariAPY: action.payload ?? true,
      };
    case SET_FETCHING_RARI_USER_DATA:
      return {
        ...state,
        isFetchingRariUserData: action.payload ?? true,
      };
    default:
      return state;
  }
}
