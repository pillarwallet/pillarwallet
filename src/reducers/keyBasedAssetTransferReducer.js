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
  SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
  SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS,
  SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
  SET_KEY_BASED_ASSETS_TO_TRANSFER,
  SET_KEY_BASED_WALLET_HAS_POSITIVE_BALANCE,
} from 'constants/keyBasedAssetTransferConstants';
import type { Balances, KeyBasedAssetTransfer } from 'models/Asset';
import type { Collectibles } from 'models/Collectible';


export type KeyBasedAssetTransferReducerState = {|
  data: KeyBasedAssetTransfer[],
  availableBalances: Balances,
  availableCollectibles: Collectibles,
  isFetchingAvailableBalances: boolean,
  isFetchingAvailableCollectibles: boolean,
  isCalculatingGas: boolean,
  hasPositiveBalance: boolean,
|};

export type KeyBasedAssetTransferReducerAction = {|
  type: string,
  payload: any
|};

const initialState = {
  data: [],
  availableBalances: {},
  availableCollectibles: [],
  isFetchingAvailableBalances: false,
  isFetchingAvailableCollectibles: false,
  isCalculatingGas: false,
  hasPositiveBalance: false,
};

const keyBasedAssetTransferReducer = (
  state: KeyBasedAssetTransferReducerState = initialState,
  action: KeyBasedAssetTransferReducerAction,
): KeyBasedAssetTransferReducerState => {
  switch (action.type) {
    case SET_KEY_BASED_ASSETS_TO_TRANSFER:
      return {
        ...state,
        data: action.payload,
      };
    case SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER:
      return {
        ...state,
        isFetchingAvailableBalances: true,
      };
    case SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER:
      return {
        ...state,
        availableBalances: action.payload,
        isFetchingAvailableBalances: false,
      };
    case SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER:
      return {
        ...state,
        isFetchingAvailableCollectibles: true,
      };
    case SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER:
      return {
        ...state,
        availableCollectibles: action.payload,
        isFetchingAvailableCollectibles: false,
      };
    case SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS:
      return {
        ...state,
        isCalculatingGas: action.payload,
      };
    case SET_KEY_BASED_WALLET_HAS_POSITIVE_BALANCE:
      return {
        ...state,
        hasPositiveBalance: action.payload,
      };
    default:
      return state;
  }
};

export default keyBasedAssetTransferReducer;
