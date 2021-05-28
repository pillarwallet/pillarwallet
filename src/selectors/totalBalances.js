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

import { BigNumber } from 'bignumber.js';
import { createSelector } from 'reselect';
import { map, mapValues, merge } from 'lodash';

// Selectors
import { assetsBalancesSelector, activeAccountIdSelector, ratesSelector, fiatCurrencySelector } from 'selectors';

// Utils
import { getRate } from 'utils/assets';
import { sum } from 'utils/bigNumber';

// Types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { Rates } from 'models/Asset';
import type {
  AssetBalancesPerAccount,
  CategoryBalancesPerChain,
  CategoryAssetsBalances,
  WalletAssetsBalances,
} from 'models/Balances';
import type {
  TotalBalances,
  AccountTotalBalances,
  WalletTotalBalances,
  StoredTotalBalances,
  CategoryTotalBalances,
} from 'models/TotalBalances';

export const walletTotalBalancesSelector: Selector<WalletTotalBalances> = createSelector(
  assetsBalancesSelector,
  ratesSelector,
  fiatCurrencySelector,
  (assetsBalancesPerAccount: AssetBalancesPerAccount, rates: Rates, currency: string): WalletTotalBalances =>
    mapValues(assetsBalancesPerAccount, (assetsBalancesPerChain: CategoryBalancesPerChain) =>
      mapValues(assetsBalancesPerChain, (assetBalances: CategoryAssetsBalances) =>
        calculateWalletAssetsFiatValue(assetBalances.wallet ?? {}, rates, currency),
      ),
    ),
);

export const totalBalancesSelector: Selector<TotalBalances> = createSelector(
  walletTotalBalancesSelector,
  (root: RootReducerState) => root.totalBalances.dataX,
  (walletBalances: WalletTotalBalances, storedTotalBalances: StoredTotalBalances): TotalBalances => {
    const wrappedWalletBalances = mapValues(walletBalances, (wallet: CategoryTotalBalances) => ({ wallet }));
    return merge(wrappedWalletBalances, storedTotalBalances);
  },
);

export const accountTotalBalancesSelector: Selector<AccountTotalBalances> = createSelector(
  activeAccountIdSelector,
  totalBalancesSelector,
  (accountId: string, totalBalancesPerAccount: TotalBalances): AccountTotalBalances => {
    return totalBalancesPerAccount[accountId] ?? {};
  },
);

export const accountWalletTotalBalancesSelector: Selector<CategoryTotalBalances> = createSelector(
  activeAccountIdSelector,
  walletTotalBalancesSelector,
  (accountId: string, walletBalances: WalletTotalBalances): CategoryTotalBalances => {
    return walletBalances[accountId] ?? {};
  },
);

const calculateWalletAssetsFiatValue = (
  assetBalances: WalletAssetsBalances,
  rates: Rates,
  currency: string,
): BigNumber => {
  const assetBalancesInFiat = map(assetBalances, (asset) => {
    if (!asset?.balance) return BigNumber(0);

    const rate = getRate(rates, asset.symbol, currency);
    return BigNumber(asset.balance).times(rate);
  });

  return sum(assetBalancesInFiat);
};
