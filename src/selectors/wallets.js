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

import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { createSelector } from 'reselect';
import {
  accountsSelector,
  activeAccountSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
  featureFlagsSelector,
} from './selectors';

const isBitcoinNetwork = (network: string): boolean => {
  return network === BLOCKCHAIN_NETWORK_TYPES.BITCOIN;
};

const getBitcoinObject = (id: string, isActive: boolean) => ({
  type: BLOCKCHAIN_NETWORK_TYPES.BITCOIN,
  id,
  walletId: '',
  isActive,
});

export const activeWalletSelector = createSelector(
  activeAccountSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
  (activeAccount, activeBlockchainNetwork, bitcoinAddresses) => {
    if (isBitcoinNetwork(activeBlockchainNetwork) && bitcoinAddresses.length) {
      return getBitcoinObject(bitcoinAddresses[0].address, true);
    }
    return activeAccount;
  },
);

export const availableWalletsSelector = createSelector(
  accountsSelector,
  bitcoinAddressSelector,
  featureFlagsSelector,
  activeBlockchainSelector,
  (accounts, bitcoinAddresses, featureFlags, activeBlockchainNetwork) => {
    const isBitcoinActive = isBitcoinNetwork(activeBlockchainNetwork);
    const { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } = featureFlags;
    const keyWallet = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED) || {};
    const availableWallets = [{ ...keyWallet, isActive: !isBitcoinActive && keyWallet.isActive }];

    if (smartWalletFeatureEnabled) {
      const smartWallet = accounts.find(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET);
      if (smartWallet) {
        availableWallets.unshift({
          ...smartWallet,
          isActive: !isBitcoinActive && smartWallet.isActive,
        });
      }
    }

    if (bitcoinAddresses.length > 0) {
      availableWallets.push(getBitcoinObject(bitcoinAddresses[0].address, isBitcoinActive));
    }
    return availableWallets;
  },
);
