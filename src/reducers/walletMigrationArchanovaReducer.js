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
  ACTION_SET_TOKEN_TO_MIGRATE,
  ACTION_REMOVE_TOKEN_TO_MIGRATE,
  ACTION_SET_COLLECTIBLE_TO_MIGRATE,
  ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
} from 'constants/walletMigrationArchanovaConstants';

// Types
import type { TokensToMigrateByAddress, CollectiblesToMigrateByAddress } from 'models/WalletMigrationArchanova';

export type WalletMigrationArchanovaReducerState = {|
  tokensToMigrate: TokensToMigrateByAddress,
  collectiblesToMigrate: CollectiblesToMigrateByAddress,
|};

const initialState = {
  tokensToMigrate: {},
  collectiblesToMigrate: {},
};

export type WalletMigrationArchanovaReducerAction =
  | SetTokenToMigrateAction
  | RemoveTokenToMigrateAction
  | SetCollectibleToMigrateAction
  | RemoveCollectibleToMigrateAction;

export type SetTokenToMigrateAction = {|
  type: typeof ACTION_SET_TOKEN_TO_MIGRATE,
  address: string,
  balance: string,
|};

export type RemoveTokenToMigrateAction = {|
  type: typeof ACTION_REMOVE_TOKEN_TO_MIGRATE,
  address: string,
|};

export type SetCollectibleToMigrateAction = {|
  type: typeof ACTION_SET_COLLECTIBLE_TO_MIGRATE,
  address: string,
|};

export type RemoveCollectibleToMigrateAction = {|
  type: typeof ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
  address: string,
|};

const walletMigrationArchanovaReducer = (
  state: WalletMigrationArchanovaReducerState = initialState,
  action: WalletMigrationArchanovaReducerAction,
): WalletMigrationArchanovaReducerState => {
  switch (action.type) {
    case ACTION_SET_TOKEN_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        const { address, balance } = action;
        draft.tokensToMigrate[address] = { address, balance };
      });
    case ACTION_REMOVE_TOKEN_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        delete draft.tokensToMigrate[action.address];
      });
    case ACTION_SET_COLLECTIBLE_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        const { address } = action;
        draft.collectiblesToMigrate[address] = { address };
      });
    case ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        delete draft.collectiblesToMigrate[action.address];
      });
    default:
      return state;
  }
};

export default walletMigrationArchanovaReducer;
