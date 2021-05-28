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
import { mapValues } from 'lodash';

// constants
import { PLR } from 'constants/assetsConstants';

// utils
import { pickSupportedAssetsWithSymbols, getTotalBalanceInFiat } from 'utils/assets';
import { BigNumber } from 'utils/common';
import { isEtherspotAccount } from 'utils/accounts';
import { getWalletAssetsSymbols } from 'utils/balances';

// types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { Rates, Asset, Assets, AssetsByAccount } from 'models/Asset';
import type { Account } from 'models/Account';
import type { WalletAssetsBalances, CategoryBalancesPerChain, AssetBalancesPerAccount } from 'models/Balances';

// selectors
import {
  assetsBalancesSelector,
  supportedAssetsSelector,
  fiatCurrencySelector,
  ratesSelector,
  activeAccountIdSelector,
  activeAccountSelector,
} from './selectors';

export const accountAssetsBalancesSelector = createSelector(
  assetsBalancesSelector,
  activeAccountIdSelector,
  (balances: AssetBalancesPerAccount, activeAccountId: ?string): CategoryBalancesPerChain | {} => {
    if (!activeAccountId) return {};
    return balances?.[activeAccountId] ?? {};
  },
);

export const accountEthereumWalletAssetsBalancesSelector = createSelector(
  accountAssetsBalancesSelector,
  (accountBalances): WalletAssetsBalances => accountBalances?.ethereum?.wallet || {},
);

export const keyBasedWalletHasPositiveBalanceSelector = createSelector(
  ({ keyBasedAssetTransfer }: RootReducerState) => keyBasedAssetTransfer?.hasPositiveBalance,
  (hasPositiveBalance) => !!hasPositiveBalance,
);

export const paymentNetworkTotalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountSelector,
  ({ paymentNetwork }) => paymentNetwork.availableStake,
  ratesSelector,
  fiatCurrencySelector,
  (activeAccount: Account, ppnBalance: number, rates: Rates, currency: string) => {
    // currently not supported by Etherspot
    if (isEtherspotAccount(activeAccount)) return BigNumber(0);

    const balances: WalletAssetsBalances = { [PLR]: { balance: ppnBalance.toString(), symbol: PLR } };
    return BigNumber(getTotalBalanceInFiat(balances, rates, currency));
  },
);

/**
 * Compat function for providing array of assets represening all accounts assets across all chains.
 * Intended to be used in place of `assetsSelector` from 'selectors`.
 */
export const assetsCompatSelector: Selector<AssetsByAccount> = createSelector(
  assetsBalancesSelector,
  supportedAssetsSelector,
  (assetsBalances: AssetBalancesPerAccount, supportedAssets: Asset[]) => {
    return mapValues(assetsBalances, (accountAssetsBalances: CategoryBalancesPerChain) => {
      const symbols = getWalletAssetsSymbols(accountAssetsBalances);
      return pickSupportedAssetsWithSymbols(supportedAssets, symbols);
    });
  },
);

/**
 * Compat function for providing array of assets represening active account assets across all chains.
 * Intended to be used in place of `accountAssetsSelector` from 'selectors`.
 */
export const accountAssetsCompatSelector: Selector<Assets> = createSelector(
  activeAccountIdSelector,
  assetsBalancesSelector,
  supportedAssetsSelector,
  (accountId: string, assetsBalances: AssetBalancesPerAccount, supportedAssets: Asset[]) => {
    const symbols = getWalletAssetsSymbols(assetsBalances[accountId]);
    return pickSupportedAssetsWithSymbols(supportedAssets, symbols);
  },
);
