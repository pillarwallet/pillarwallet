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
import { createSelector } from 'reselect';

// Constants
import { ARCHANOVA_WALLET_ASSET_MIGRATION } from 'constants/archanovaConstants';
import { TX_PENDING_STATUS } from 'constants/historyConstants';

// Selectors
import { archanovaAccountIdSelector } from 'selectors/accounts';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';
import { collectiblesPerAccountSelector } from 'selectors/collectibles';
import { archanovaAccountEthereumHistorySelector } from 'selectors/history';

// Utils
import { mapNotNil } from 'utils/array';
import { findCollectible } from 'utils/collectibles';
import { hasNonNegligileWalletBalances } from 'utils/walletMigrationArchanova';

// Types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { AssetBalancesPerAccount } from 'models/Balances';
import type { CollectibleId, Collectible, CollectiblesStore } from 'models/Collectible';
import type { Transaction } from 'models/Transaction';

/**
 * Returns all collectibles for archanova account
 */
export const archanovaCollectiblesSelector: Selector<Collectible[]> = createSelector(
  collectiblesPerAccountSelector,
  archanovaAccountIdSelector,
  (collectiblesPerAccount: CollectiblesStore, archanovaAccountId: ?string): Collectible[] => {
    if (!archanovaAccountId) return [];
    return collectiblesPerAccount[archanovaAccountId]?.ethereum ?? [];
  },
);

/**
 * Returns archanova account collectibles selected for migration.
 */
export const collectiblesToMigrateSelector: Selector<Collectible[]> = createSelector(
  archanovaCollectiblesSelector,
  (root: RootReducerState) => root.walletMigrationArchanova.collectiblesToMigrate,
  (archanovaCollectibles: Collectible[], collectiblesToMigrate: CollectibleId[]): Collectible[] => {
    return mapNotNil(collectiblesToMigrate, (id) => findCollectible(archanovaCollectibles, id));
  },
);

// Checks for non-negligible balances
export const showWalletMigrationArchanovaSelector: Selector<boolean> = createSelector(
  archanovaAccountIdSelector,
  assetsBalancesPerAccountSelector,
  (accountId: ?string, balancesPerAccount: AssetBalancesPerAccount): boolean => {
    if (!accountId) return false;

    const ethereumWalletBalancs = balancesPerAccount[accountId]?.ethereum?.wallet;
    return hasNonNegligileWalletBalances(ethereumWalletBalancs);
  },
);

export const archanovaMigrationTransactionsSelector: Selector<Transaction[]> = createSelector(
  archanovaAccountEthereumHistorySelector,
  (history: Transaction[]): Transaction[] => {
    return history.filter(({ tag }) => tag === ARCHANOVA_WALLET_ASSET_MIGRATION);
  },
);

export const hasPendingMigrationTransactionsSelector: Selector<boolean> = createSelector(
  archanovaMigrationTransactionsSelector,
  (migrationTransactions: Transaction[]): boolean => {
    return migrationTransactions.some(({ status }) => status === TX_PENDING_STATUS);
  },
);
