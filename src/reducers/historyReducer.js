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
import get from 'lodash.get';
import { REHYDRATE } from 'redux-persist';
import { SET_HISTORY, ADD_TRANSACTION, SET_GAS_INFO } from 'constants/historyConstants';
import type { TransactionsStore } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';

export type HistoryState = {
  data: TransactionsStore,
  gasInfo: GasInfo,
  isFetched: boolean,
}

export type HistoryAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: {},
  gasInfo: {
    gasPrice: {},
    isFetched: false,
  },
  isFetched: false,
};

export default function historyReducer(
  state: HistoryState = initialState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...state,
        data: get(action.payload, 'history.data', {}),
      };
    case ADD_TRANSACTION:
      const accountTrxs = state.data[action.payload.accountId] || [];
      const trxs = {
        ...state.data,
        [action.payload.accountId]: [...accountTrxs, action.payload.historyTx],
      };

      return Object.assign(
        {},
        state,
        { data: trxs },
      );
    case SET_HISTORY:
      return Object.assign(
        {},
        state,
        { isFetched: true, data: action.payload },
      );
    case SET_GAS_INFO: {
      const gasPriceInfo = action.payload;
      const isGasFetched = !!Object.keys(gasPriceInfo).length;
      return { ...state, gasInfo: { gasPrice: gasPriceInfo, isFetched: isGasFetched } };
    }
    default:
      return state;
  }
}
