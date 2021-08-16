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
  ACTION_RESET_ASSETS_TO_MIGRATE,
  ACTION_SET_TOKEN_TO_MIGRATE,
  ACTION_REMOVE_TOKEN_TO_MIGRATE,
  ACTION_SET_COLLECTIBLE_TO_MIGRATE,
  ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
} from 'constants/walletMigrationArchanovaConstants';

// Utils
import { buildCollectibleKey } from 'utils/collectibles';
import { setValueForAddress, addressAsKey } from 'utils/common';

// Types
import type { TokensToMigrateByAddress, CollectiblesToMigrateByCollectibleKey } from 'models/WalletMigrationArchanova';


export type WalletMigrationArchanovaReducerState = {|
  tokensToMigrate: TokensToMigrateByAddress,
  collectiblesToMigrate: CollectiblesToMigrateByCollectibleKey,
|};

const initialState = {
  tokensToMigrate: {},
  collectiblesToMigrate: {},
};

export type WalletMigrationArchanovaReducerAction =
  | ResetAssetsToMigateAction
  | SetTokenToMigrateAction
  | RemoveTokenToMigrateAction
  | SetCollectibleToMigrateAction
  | RemoveCollectibleToMigrateAction;

export type ResetAssetsToMigateAction = {|
  type: typeof ACTION_RESET_ASSETS_TO_MIGRATE,
|};

export type SetTokenToMigrateAction = {|
  type: typeof ACTION_SET_TOKEN_TO_MIGRATE,
  address: string,
  balance: string,
  decimals: number,
|};

export type RemoveTokenToMigrateAction = {|
  type: typeof ACTION_REMOVE_TOKEN_TO_MIGRATE,
  address: string,
|};

export type SetCollectibleToMigrateAction = {|
  type: typeof ACTION_SET_COLLECTIBLE_TO_MIGRATE,
  contractAddress: string,
  id: string,
  isLegacy: boolean,
|};

export type RemoveCollectibleToMigrateAction = {|
  type: typeof ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
  contractAddress: string,
  id: string,
|};

const walletMigrationArchanovaReducer = (
  state: WalletMigrationArchanovaReducerState = initialState,
  action: WalletMigrationArchanovaReducerAction,
): WalletMigrationArchanovaReducerState => {
  switch (action.type) {
    case ACTION_RESET_ASSETS_TO_MIGRATE:
      return initialState;

    case ACTION_SET_TOKEN_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        const { address, balance, decimals } = action;
        setValueForAddress(draft.tokensToMigrate, address, { address, balance, decimals });
      });

    case ACTION_REMOVE_TOKEN_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        delete draft.tokensToMigrate[addressAsKey(action.address)];
      });

    case ACTION_SET_COLLECTIBLE_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        const { contractAddress, id, isLegacy } = action;
        const key = buildCollectibleKey(contractAddress, id);
        draft.collectiblesToMigrate[key] = { contractAddress, id, isLegacy };
      });

    case ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE:
      return produce(state, (draft: WalletMigrationArchanovaReducerState) => {
        const key = buildCollectibleKey(action.contractAddress, action.id);
        delete draft.collectiblesToMigrate[key];
      });

    default:
      return state;
  }
};

export default walletMigrationArchanovaReducer;
