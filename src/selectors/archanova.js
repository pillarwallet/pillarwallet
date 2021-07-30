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

import { createSelector } from 'reselect';

// constants
import { ETH } from 'constants/assetsConstants';
import { ARCHANOVA_WALLET_ENS_MIGRATION, ARCHANOVA_WALLET_UPGRADE_STATUSES } from 'constants/archanovaConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { accountHasGasTokenSupport, getArchanovaWalletStatus } from 'utils/archanova';
import { findFirstArchanovaAccount, getAccountEnsName, isArchanovaAccount } from 'utils/accounts';
import { getEnsPrefix } from 'utils/common';
import { isProdEnv } from 'utils/environment';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { useActiveAccount, useRootSelector } from 'selectors';
import { archanovaAccountIdSelector } from 'selectors/accounts';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';
import { collectiblesPerAccountSelector } from 'selectors/collectibles';

// types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { AssetBalancesPerAccount, WalletAssetsBalances } from 'models/Balances';
import type { Collectible, CollectiblesStore } from 'models/Collectible';

// local
import { accountsSelector } from './selectors';
import { archanovaAccountEthereumHistorySelector } from './history';


/**
 * Returns all wallet asset balances for archanova account.
 */
export const archanovaWalletAssetsBalancesSelector: Selector<WalletAssetsBalances> = createSelector(
  archanovaAccountIdSelector,
  assetsBalancesPerAccountSelector,
  (archanovaAccountId: ?string, balancesPerAccount: AssetBalancesPerAccount): WalletAssetsBalances => {
    if (!archanovaAccountId) return {};
    return balancesPerAccount[archanovaAccountId]?.ethereum?.wallet ?? {};
  },
);

/**
 * Returns all collectibles for archanova account.
 */
export const archanovaCollectiblesSelector: Selector<Collectible[]> = createSelector(
  archanovaAccountIdSelector,
  collectiblesPerAccountSelector,
  (archanovaAccountId: ?string, collectiblesPerAccount: CollectiblesStore): Collectible[] => {
    if (!archanovaAccountId) return [];
    return collectiblesPerAccount[archanovaAccountId]?.ethereum ?? [];
  },
);

export const isArchanovaAccountDeployedSelector = ({ accounts: { data: accounts }, smartWallet }: RootReducerState) => {
  const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWallet);
  return archanovaWalletStatus.status === ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE;
};

export const isGasTokenSupportedSelector = ({ smartWallet: { connectedAccount } }: RootReducerState) => {
  return accountHasGasTokenSupport(connectedAccount);
};

export const preferredGasTokenSelector = ({
  appSettings: {
    data: { preferredGasToken },
  },
}: RootReducerState) => {
  if (!firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_FEES_PAID_WITH_PLR)) return ETH;
  return preferredGasToken || ETH;
};

export const useGasTokenSelector: Selector<boolean> = createSelector(
  isGasTokenSupportedSelector,
  preferredGasTokenSelector,
  (isGasTokenSupported: boolean, preferredGasToken: string) => {
    return isGasTokenSupported && preferredGasToken !== ETH;
  },
);

/**
 * return ENS needed if there was no ENS marked transaction sent
 * on any environment (for test purposes as there is no ENS on Kovan testnet)
 * or there's existing ENS name on Archanova account on homestead (Mainnet) environment
 */
export const isEnsMigrationNeededSelector = createSelector(
  accountsSelector,
  archanovaAccountEthereumHistorySelector,
  (accounts, archanovaAccountHistory): boolean => {
    const isEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.ENS_MIGRATOR_ENABLED);
    if (!isEnabled) return false;

    const archanovaAccount = findFirstArchanovaAccount(accounts);

    const isEnsMigrationNeeded =
      archanovaAccount && (!isProdEnv() || getAccountEnsName(archanovaAccount)?.endsWith(getEnsPrefix()));

    const isEnsMigrationTransactionAlreadySent = archanovaAccountHistory.some(
      ({ tag }) => tag === ARCHANOVA_WALLET_ENS_MIGRATION,
    );

    return !!isEnsMigrationNeeded && !isEnsMigrationTransactionAlreadySent;
  },
);

export const useArchanovaWalletStatus = (): ArchanovaWalletStatus => {
  const accounts = useRootSelector((root) => root.accounts.data);
  const archanovaWalletState = useRootSelector((root) => root.smartWallet);
  return getArchanovaWalletStatus(accounts, archanovaWalletState);
};

export const useIsPillarPaySupported = () => {
  const activeAccount = useActiveAccount();
  return isArchanovaAccount(activeAccount);
};
