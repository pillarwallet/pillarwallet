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
import { ADD_EXCHANGE_GAS_FEE_INFO, RESET_EXCHANGE_GAS_FEE_INFO } from 'constants/exchangeConstants';

// Modals
import type { ExchangeFeeInfo } from 'models/Exchange';

export type ExchangeGasFeeReducerState = {
  data: ExchangeFeeInfo[];
};

export type ExchangeGasFeeReducerAction = {
  type: string;
  payload: any;
};

export const initialState = {
  data: [],
};

export default function manageExchangeGasFeeReducer(
  state: ExchangeGasFeeReducerState = initialState,
  action: ExchangeGasFeeReducerAction,
) {
  const { data } = state;
  switch (action.type) {
    case ADD_EXCHANGE_GAS_FEE_INFO:
      const { data: addFeeInfo } = action.payload;

      const { provider, chain, gasFeeAsset } = addFeeInfo;

      const index = state.data?.findIndex(
        (feeInfo) => feeInfo.provider === provider && feeInfo.chain === chain && feeInfo.gasFeeAsset === gasFeeAsset,
      );
      if (index !== -1) state.data.splice(index, 1);

      return { ...state, data: [...data, addFeeInfo] };

    case RESET_EXCHANGE_GAS_FEE_INFO:
      return {
        ...state,
        data: [],
      };

    default:
      return state;
  }
}
