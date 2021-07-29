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
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { ethereumRatesSelector } from 'selectors';
import { archanovaWalletAssetsBalancesSelector, archanovaCollectiblesSelector } from 'selectors/archanova';
import { archanovaAccountEthereumHistorySelector } from 'selectors/history';

// Utils
import { mapNotNil } from 'utils/array';
import { findCollectible } from 'utils/collectibles';
import { recordValues } from 'utils/object';
import { hasNonNegligileWalletBalances } from 'utils/walletMigrationArchanova';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Collectible } from 'models/Collectible';
import type { RatesByAssetAddress } from 'models/Rates';
import type { Transaction } from 'models/Transaction';
import type { CollectiblesToMigrateByCollectibleKey } from 'models/WalletMigrationArchanova';


/**
 * Returns archanova account collectibles selected for migration.
 */
export const collectiblesToMigrateSelector: Selector<Collectible[]> = createSelector(
  archanovaCollectiblesSelector,
  (root: RootReducerState) => root.walletMigrationArchanova.collectiblesToMigrate,
  (
    archanovaCollectibles: Collectible[],
    collectiblesToMigrate: CollectiblesToMigrateByCollectibleKey,
  ): Collectible[] => {
    const collectibleValues = recordValues(collectiblesToMigrate);
    return mapNotNil(collectibleValues, ({ contractAddress, id }) =>
      findCollectible(archanovaCollectibles, contractAddress, id),
    );
  },
);

// Checks for non-negligible balances
export const showWalletMigrationArchanovaSelector: Selector<boolean> = createSelector(
  archanovaWalletAssetsBalancesSelector,
  archanovaCollectiblesSelector,
  ethereumRatesSelector,
  (walletBalances: WalletAssetsBalances, collectibles: Collectible[], rates: RatesByAssetAddress): boolean => {
    const isEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.WALLET_MIGRATION_ARCHANOVA_ENABLED);
    if (!isEnabled) return false;

    return hasNonNegligileWalletBalances(walletBalances, rates) || !!collectibles.length;
  },
);

/**
 * Returns are archanova wallet asset migration transactions
 */
export const archanovaMigrationTransactionsSelector: Selector<Transaction[]> = createSelector(
  archanovaAccountEthereumHistorySelector,
  (history: Transaction[]): Transaction[] => {
    return history.filter(({ tag }) => tag === ARCHANOVA_WALLET_ASSET_MIGRATION);
  },
);

/**
 * Returns true when there is a pending asset migration transaction
 */
export const hasPendingMigrationTransactionsSelector: Selector<boolean> = createSelector(
  archanovaMigrationTransactionsSelector,
  (migrationTransactions: Transaction[]): boolean => {
    return migrationTransactions.some(({ status }) => status === TX_PENDING_STATUS);
  },
);
