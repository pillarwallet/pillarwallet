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
  UPDATE_COLLECTIBLES,
  SET_COLLECTIBLES_TRANSACTION_HISTORY,
  ADD_COLLECTIBLE_TRANSACTION,
} from 'constants/collectiblesConstants';
import type { CollectiblesStore, CollectiblesTransactionsStore } from 'models/Collectible';


export type CollectiblesState = {
  data: CollectiblesStore,
  transactionHistory: CollectiblesTransactionsStore,
};

export type CollectiblesAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {},
  transactionHistory: {},
};


export default function collectiblesReducer(
  state: CollectiblesState = initialState,
  action: CollectiblesAction,
): CollectiblesState {
  switch (action.type) {
    case UPDATE_COLLECTIBLES:
      return {
        ...state,
        data: action.payload || {},
      };
    case SET_COLLECTIBLES_TRANSACTION_HISTORY:
      return {
        ...state,
        transactionHistory: action.payload || {},
      };
    case ADD_COLLECTIBLE_TRANSACTION:
      const { accountId, tokenId, transactionData } = action.payload;
      const accountCollectibles = state.data[accountId] || [];
      const accountTransactionHistory = state.transactionHistory[accountId] || [];
      return {
        ...state,
        data: {
          ...state.data,
          [accountId]: [...accountCollectibles].filter(({ id }) => id !== tokenId),
        },
        transactionHistory: {
          ...state.transactionHistory,
          [accountId]: [...accountTransactionHistory, transactionData],
        },
      };
    default:
      return state;
  }
}

