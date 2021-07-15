// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

// Constants
import {
  ACTION_SET_TOKEN_TO_MIGRATE,
  ACTION_REMOVE_TOKEN_TO_MIGRATE,
  ACTION_SET_COLLECTIBLE_TO_MIGRATE,
  ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
} from 'constants/walletMigrationArchanovaConstants';

// Types
import type {
  SetTokenToMigrateAction,
  RemoveTokenToMigrateAction,
  SetCollectibleToMigrateAction,
  RemoveCollectibleToMigrateAction,
} from 'reducers/walletMigrationArchanovaReducer';

export function setTokenToMigrateAction(address: string, balance: string): SetTokenToMigrateAction {
  return {
    type: ACTION_SET_TOKEN_TO_MIGRATE,
    address,
    balance,
  };
}

export function removeTokenToMigrateAction(address: string): RemoveTokenToMigrateAction {
  return {
    type: ACTION_REMOVE_TOKEN_TO_MIGRATE,
    address,
  };
}

export function setCollectibleToMigrateAction(address: string): SetCollectibleToMigrateAction {
  return {
    type: ACTION_SET_COLLECTIBLE_TO_MIGRATE,
    address,
  };
}

export function removeCollectibleToMigrateAction(address: string): RemoveCollectibleToMigrateAction {
  return {
    type: ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
    address,
  };
}
