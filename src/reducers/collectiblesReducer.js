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
  UPDATE_COLLECTIBLES,
  SET_COLLECTIBLES_TRANSACTION_HISTORY,
  ADD_COLLECTIBLE_HISTORY_TRANSACTION,
  SET_UPDATING_COLLECTIBLE_TRANSACTION,
} from 'constants/collectiblesConstants';

// utils
import { isMatchingCollectible } from 'utils/assets';

// types
import type {
  CollectiblesStore,
  CollectiblesHistoryStore,
  Collectible,
  CollectibleTransaction,
} from 'models/Collectible';
import type { ChainRecord } from 'models/Chain';


export type CollectiblesReducerState = {
  data: CollectiblesStore,
  transactionHistory: CollectiblesHistoryStore,
  updatingTransaction: ?string,
};

export type CollectiblesAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {},
  transactionHistory: {},
  updatingTransaction: null,
};

const removeFromCollectibles = (
  collectibles: Collectible[],
  collectibleToRemove: { tokenId: string, contractAddress: string },
) => {
  const { tokenId: id, contractAddress } = collectibleToRemove;
  return collectibles.filter((
    existing,
  ) => !isMatchingCollectible(existing, { id, contractAddress }));
};

const addAccountCollectibleTransaction = (
  accountHistory: ChainRecord<CollectibleTransaction[]>,
  payload: { chain: string, transaction: CollectibleTransaction },
) => {
  const { chain, transaction } = payload;
  const accountHistoryForChain = accountHistory?.[chain] ?? [];
  return {
    ...accountHistory,
    [chain]: accountHistoryForChain.concat(transaction),
  };
};

const collectiblesReducer = (
  state: CollectiblesReducerState = initialState,
  action: CollectiblesAction,
): CollectiblesReducerState => {
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
        updatingTransaction: null,
      };
    case SET_UPDATING_COLLECTIBLE_TRANSACTION:
      return {
        ...state,
        updatingTransaction: action.payload,
      };
    case ADD_COLLECTIBLE_HISTORY_TRANSACTION:
      const { accountId } = action.payload;
      const accountCollectibles = state.data[accountId] ?? [];
      const accountHistory = state.transactionHistory[accountId] ?? {};
      return {
        ...state,
        data: {
          ...state.data,
          [accountId]: removeFromCollectibles(accountCollectibles, action.payload),
        },
        transactionHistory: {
          ...state.transactionHistory,
          [accountId]: addAccountCollectibleTransaction(accountHistory, action.payload),
        },
      };
    default:
      return state;
  }
};

export default collectiblesReducer;
