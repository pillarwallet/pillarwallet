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

import produce from 'immer';

// Constants
import {
  ACTION_SET_TOKENS_TO_MIGRATE,
  ACTION_SET_COLLECTIBLES_TO_MIGRATE,
} from 'constants/walletMigrationArchanovaConstants';

// Types
import type { WalletAssetsBalances } from 'models/Balances';
import type { Collectible } from 'models/Collectible';


export type WalletMigrationArchanovaReducerState = {|
  tokensToMigrate: WalletAssetsBalances,
  collectiblesToMigrate: Collectible[],
|};

export type WalletMigrationArchanovaReducerAction = SetTokensToMigrateAction | SetCollectiblesToMigrateAction;

type SetTokensToMigrateAction = {|
  type: typeof ACTION_SET_TOKENS_TO_MIGRATE,
  payload: WalletAssetsBalances,
|};

type SetCollectiblesToMigrateAction = {|
  type: typeof ACTION_SET_COLLECTIBLES_TO_MIGRATE,
  payload: Collectible[],
|};

const initialState = {
  tokensToMigrate: {},
  collectiblesToMigrate: [],
};

const walletMigrationArchanovaReducer = (
  state: WalletMigrationArchanovaReducerState = initialState,
  action: WalletMigrationArchanovaReducerAction,
): WalletMigrationArchanovaReducerState => {
  switch (action.type) {
    case ACTION_SET_TOKENS_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        draft.tokensToMigrate = action.payload;
      });
    case ACTION_SET_COLLECTIBLES_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        draft.collectiblesToMigrate = action.payload;
      });
    default:
      return state;
  }
};

export default walletMigrationArchanovaReducer;
