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

import { getEnv } from 'configs/envConfig';

// Constants
import { ARCHANOVA_WALLET_ASSET_MIGRATION } from 'constants/archanovaConstants';
import { CHAIN } from 'constants/chainConstants';
import { ADD_HISTORY_TRANSACTION } from 'constants/historyConstants';
import {
  ACTION_SET_TOKEN_TO_MIGRATE,
  ACTION_REMOVE_TOKEN_TO_MIGRATE,
  ACTION_SET_COLLECTIBLE_TO_MIGRATE,
  ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
} from 'constants/walletMigrationArchanovaConstants';

// Selectors
import { activeAccountSelector } from 'selectors';

// Utils
import { nativeAssetPerChain } from 'utils/chains';
import { logBreadcrumb } from 'utils/common';
import { buildHistoryTransaction } from 'utils/history';

// Types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type {
  SetTokenToMigrateAction,
  RemoveTokenToMigrateAction,
  SetCollectibleToMigrateAction,
  RemoveCollectibleToMigrateAction,
} from 'reducers/walletMigrationArchanovaReducer';


export function setTokenToMigrateAction(address: string, balance: string, decimals: number): SetTokenToMigrateAction {
  return {
    type: ACTION_SET_TOKEN_TO_MIGRATE,
    address,
    balance,
    decimals,
  };
}

export function removeTokenToMigrateAction(address: string): RemoveTokenToMigrateAction {
  return {
    type: ACTION_REMOVE_TOKEN_TO_MIGRATE,
    address,
  };
}

export function setCollectibleToMigrateAction(contractAddress: string, id: string): SetCollectibleToMigrateAction {
  return {
    type: ACTION_SET_COLLECTIBLE_TO_MIGRATE,
    contractAddress,
    id,
  };
}

export function removeCollectibleToMigrateAction(
  contractAddress: string,
  id: string,
): RemoveCollectibleToMigrateAction {
  return {
    type: ACTION_REMOVE_COLLECTIBLE_TO_MIGRATE,
    contractAddress,
    id,
  };
}

export function addMigrationTransactionToHistoryAction(hash: string) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      return;
    }

    const eth = nativeAssetPerChain.ethereum;
    const migratorAddress = getEnv().ARCHANOVA_MIGRATOR_CONTRACT_ADDRESS;

    const transaction = buildHistoryTransaction({
      from: activeAccount.id,
      to: migratorAddress,
      hash,
      assetSymbol: eth.symbol,
      assetAddress: eth.address,
      value: '0',
      tag: ARCHANOVA_WALLET_ASSET_MIGRATION,
    });

    logBreadcrumb('walletMigrationArchanova', 'addMigrationTransactionToHistoryAction', { transaction });

    dispatch({
      type: ADD_HISTORY_TRANSACTION,
      payload: {
        accountId: activeAccount.id,
        chain: CHAIN.ETHEREUM,
        transaction,
      },
    });
  };
}
