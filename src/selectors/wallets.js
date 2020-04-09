// @flow

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


export const activeWalletSelector = createSelector(
  activeAccountSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
  (activeAccount, activeBlockchainNetwork, bitcoinAddresses) => {
    if (activeBlockchainNetwork && activeBlockchainNetwork === 'BITCOIN' && bitcoinAddresses.length) {
      return {
        type: BLOCKCHAIN_NETWORK_TYPES.BITCOIN,
        id: bitcoinAddresses[0].address,
        walletId: '',
        isActive: false,
      };
    }
    return activeAccount;
  },
);

export const availableWalletsSelector = createSelector(
  accountsSelector,
  bitcoinAddressSelector,
  featureFlagsSelector,
  (accounts, bitcoinAddresses, featureFlags) => {
    const { SMART_WALLET_ENABLED: smartWalletFeatureEnabled, BITCOIN_ENABLED: bitcoinFeatureEnabled } = featureFlags;
    const keyWallet = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED) || {};
    const availableWallets = [keyWallet];

    if (smartWalletFeatureEnabled) {
      const smartWallet = accounts.find(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET);
      if (smartWallet) availableWallets.unshift(smartWallet);
    }

    if (bitcoinFeatureEnabled && bitcoinAddresses.length > 0) {
      availableWallets.push({
        type: BLOCKCHAIN_NETWORK_TYPES.BITCOIN,
        id: bitcoinAddresses[0].address,
        walletId: '',
        isActive: false,
      });
    }
    return availableWallets;
  },
);
