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
import { sortBy, isEmpty } from 'lodash';
import { createSelector } from 'reselect';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// selectors
import { useRootSelector } from 'selectors';

// types
import type { RootReducerState } from 'reducers/rootReducer';

// local
import { accountsSelector, activeAccountSelector, activeBlockchainSelector } from './selectors';


export const activeWalletSelector = createSelector(
  activeAccountSelector,
  activeBlockchainSelector,
  (activeAccount) => activeAccount,
);

export const availableWalletsSelector = createSelector(
  accountsSelector,
  activeBlockchainSelector,
  (accounts) => {
    const availableWallets = accounts.map((wallet) => ({
      ...wallet,
      isActive: !!wallet.isActive,
    }));

    // etherspot account first
    return sortBy(
      availableWallets,
      ({ type }) => type === ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET ? -1 : 1,
    );
  },
);

export const hasKeyBasedAssetsTransferInProgressSelector = createSelector(
  ({ keyBasedAssetTransfer }: RootReducerState) => keyBasedAssetTransfer.data,
  ({ keyBasedAssetTransfer }: RootReducerState) => keyBasedAssetTransfer.creatingTransactions,
  (keyBasedAssetsTransfer, creatingTransactions) => creatingTransactions || keyBasedAssetsTransfer.some(
    (keyBasedAssetTransfer) => !isEmpty(keyBasedAssetTransfer?.signedTransaction),
  ),
);

export function useIsWalletBackedUp() {
  const backupStatus = useRootSelector((root) => root.wallet.backupStatus);
  return backupStatus.isImported || backupStatus.isBackedUp;
}
