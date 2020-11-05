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
  SET_ESTIMATING_TRANSACTION,
  SET_TRANSACTION_ESTIMATE_ERROR,
  SET_TRANSACTION_ESTIMATE_FEE_INFO,
} from 'constants/transactionEstimateConstants';

// types
import type { TransactionFeeInfo } from 'models/Transaction';


export type TransactionEstimateReducerState = {
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  errorMessage: ?string,
};

export type TransactionEstimateReducerAction = {
  type: string,
  payload: any
};

export const initialState = {
  feeInfo: null,
  isEstimating: false,
  errorMessage: null,
};

const transactionEstimateReducer = (
  state: TransactionEstimateReducerState = initialState,
  action: TransactionEstimateReducerAction,
): TransactionEstimateReducerState => {
  switch (action.type) {
    case SET_ESTIMATING_TRANSACTION:
      return {
        ...state,
        isEstimating: action.payload,
      };
    case SET_TRANSACTION_ESTIMATE_FEE_INFO:
      return {
        ...state,
        feeInfo: action.payload,
      };
    case SET_TRANSACTION_ESTIMATE_ERROR:
      return {
        ...state,
        isEstimating: false,
        errorMessage: action.payload,
      };
    default:
      return state;
  }
};

export default transactionEstimateReducer;
