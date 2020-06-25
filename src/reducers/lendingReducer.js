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
  SET_LENDING_ASSETS_TO_DEPOSIT,
  SET_CALCULATING_LENDING_DEPOSIT_TRANSACTION_ESTIMATE,
  SET_CALCULATING_LENDING_WITHDRAW_TRANSACTION_ESTIMATE,
  SET_LENDING_DEPOSIT_TRANSACTION_ESTIMATE,
  SET_LENDING_DEPOSITED_ASSETS,
  SET_FETCHING_LENDING_ASSETS_TO_DEPOSIT,
  SET_FETCHING_LENDING_DEPOSITED_ASSETS,
  SET_LENDING_WITHDRAW_TRANSACTION_ESTIMATE,
} from 'constants/lendingConstants';
import type { AssetToDeposit, DepositedAsset } from 'models/Asset';


export type LendingReducerState = {
  assetsToDeposit: AssetToDeposit[],
  depositedAssets: DepositedAsset[],
  isFetchingDepositedAssets: boolean,
  isFetchingAssetsToDeposit: boolean,
  isCalculatingDepositTransactionEstimate: boolean,
  isCalculatingWithdrawTransactionEstimate: boolean,
  depositTransactionEstimate: ?Object,
  withdrawTransactionEstimate: ?Object,
};

export type LendingReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  assetsToDeposit: [],
  depositedAssets: [],
  isFetchingDepositedAssets: false,
  isFetchingAssetsToDeposit: false,
  isCalculatingDepositTransactionEstimate: false,
  isCalculatingWithdrawTransactionEstimate: false,
  depositTransactionEstimate: null,
  withdrawTransactionEstimate: null,
};

export default function lendingReducer(
  state: LendingReducerState = initialState,
  action: LendingReducerAction,
): LendingReducerState {
  switch (action.type) {
    case SET_FETCHING_LENDING_ASSETS_TO_DEPOSIT:
      return { ...state, isFetchingAssetsToDeposit: action.payload || true };
    case SET_LENDING_ASSETS_TO_DEPOSIT:
      return { ...state, assetsToDeposit: action.payload, isFetchingAssetsToDeposit: false };
    case SET_FETCHING_LENDING_DEPOSITED_ASSETS:
      return { ...state, isFetchingDepositedAssets: action.payload || true };
    case SET_LENDING_DEPOSITED_ASSETS:
      return { ...state, depositedAssets: action.payload, isFetchingDepositedAssets: false };
    case SET_CALCULATING_LENDING_DEPOSIT_TRANSACTION_ESTIMATE:
      return {
        ...state,
        isCalculatingDepositTransactionEstimate: true,
        depositTransactionEstimate: null,
      };
    case SET_LENDING_DEPOSIT_TRANSACTION_ESTIMATE:
      return {
        ...state,
        isCalculatingDepositTransactionEstimate: false,
        depositTransactionEstimate: action.payload,
      };
    case SET_CALCULATING_LENDING_WITHDRAW_TRANSACTION_ESTIMATE:
      return {
        ...state,
        isCalculatingWithdrawTransactionEstimate: true,
        withdrawTransactionEstimate: null,
      };
    case SET_LENDING_WITHDRAW_TRANSACTION_ESTIMATE:
      return {
        ...state,
        isCalculatingWithdrawTransactionEstimate: false,
        withdrawTransactionEstimate: action.payload,
      };
    default:
      return state;
  }
}
