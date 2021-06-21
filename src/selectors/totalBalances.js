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
import { map, merge } from 'lodash';

// Selectors
import {
  assetsBalancesSelector,
  activeAccountIdSelector,
  ratesPerChainSelector,
  fiatCurrencySelector,
} from 'selectors';

// Utils
import { getRate } from 'utils/assets';
import { sum } from 'utils/bigNumber';
import { mapChainRecordValues } from 'utils/chains';
import { mapRecordValues } from 'utils/object';

// Types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type {
  AssetBalancesPerAccount,
  CategoryBalancesPerChain,
  CategoryAssetsBalances,
  WalletAssetsBalances,
} from 'models/Balances';
import type {
  Chain,
  ChainRecord,
} from 'models/Chain';
import type {
  TotalBalances,
  AccountTotalBalances,
  StoreTotalBalances,
  WalletTotalBalances,
} from 'models/TotalBalances';
import type {
  RatesBySymbol,
  RatesPerChain,
} from 'models/Rates';

export const walletTotalBalancesSelector: Selector<WalletTotalBalances> = createSelector(
  assetsBalancesSelector,
  ratesPerChainSelector,
  fiatCurrencySelector,
  (
    assetsBalancesPerAccount: AssetBalancesPerAccount,
    ratesPerChain: RatesPerChain,
    currency: string,
  ): WalletTotalBalances => mapRecordValues(
    assetsBalancesPerAccount,
    (assetsBalancesPerChain: CategoryBalancesPerChain) => mapChainRecordValues(
      assetsBalancesPerChain,
      (assetBalances: CategoryAssetsBalances, chain: Chain) => calculateWalletAssetsFiatValue(
        assetBalances.wallet ?? {},
        ratesPerChain[chain] ?? {},
        currency,
      ),
    ),
  ),
);

export const totalBalancesSelector: Selector<TotalBalances> = createSelector(
  walletTotalBalancesSelector,
  (root: RootReducerState) => root.totalBalances.data,
  (walletBalances: WalletTotalBalances, storeBalances: StoreTotalBalances): TotalBalances => {
    const wrappedWalletBalances = mapRecordValues(walletBalances, (wallet: ChainRecord<BigNumber>) => ({ wallet }));
    return merge({}, storeBalances, wrappedWalletBalances);
  },
);

export const accountTotalBalancesSelector: Selector<AccountTotalBalances> = createSelector(
  activeAccountIdSelector,
  totalBalancesSelector,
  (accountId: ?string, totalBalancesPerAccount: TotalBalances): AccountTotalBalances => {
    if (!accountId) return {};
    return totalBalancesPerAccount[accountId] ?? {};
  },
);

export const accountWalletBalancePerChainSelector: Selector<ChainRecord<BigNumber>> = createSelector(
  activeAccountIdSelector,
  walletTotalBalancesSelector,
  (accountId: string, walletBalances: WalletTotalBalances): ChainRecord<BigNumber> => {
    return walletBalances[accountId] ?? {};
  },
);

export const accountDepositsBalancePerChainSelector = (root: RootReducerState) => {
  const accountId = activeAccountIdSelector(root);
  return root.totalBalances.data[accountId]?.deposits ?? {};
};

export const accountInvestmentsBalancePerChainSelector = (root: RootReducerState) => {
  const accountId = activeAccountIdSelector(root);
  return root.totalBalances.data[accountId]?.investments ?? {};
};

export const accountLiquidityPoolsBalancePerChainSelector = (root: RootReducerState) => {
  const accountId = activeAccountIdSelector(root);
  return root.totalBalances.data[accountId]?.liquidityPools ?? {};
};

export const accountRewardsBalancePerChainSelector = (root: RootReducerState) => {
  const accountId = activeAccountIdSelector(root);
  return root.totalBalances.data[accountId]?.rewards ?? {};
};

const calculateWalletAssetsFiatValue = (
  assetBalances: WalletAssetsBalances,
  rates: RatesBySymbol,
  currency: string,
): BigNumber => {
  const assetBalancesInFiat = map(assetBalances, (asset) => {
    if (!asset?.balance) return BigNumber(0);

    const rate = getRate(rates, asset.symbol, currency);
    return BigNumber(asset.balance).times(rate);
  });

  return sum(assetBalancesInFiat);
};
