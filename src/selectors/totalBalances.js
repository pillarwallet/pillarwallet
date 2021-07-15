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
  activeAccountIdSelector,
  ratesPerChainSelector,
  fiatCurrencySelector,
  usdToFiatRateSelector,
} from 'selectors';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';

// Utils
import { hasServiceAssetBalanceForAddress } from 'utils/balances';
import { sum } from 'utils/bigNumber';
import { mapChainRecordValues } from 'utils/chains';
import { mapRecordValues } from 'utils/object';
import { getFiatValueFromUsd, getAssetRateInFiat } from 'utils/rates';
import { mapAccountCategoryChainRecordValues } from 'utils/totalBalances';

// Types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type {
  AssetBalancesPerAccount,
  AccountAssetBalances,
  CategoryAssetsBalances,
  WalletAssetBalance,
} from 'models/Balances';
import type {
  Chain,
  ChainRecord,
} from 'models/Chain';
import type {
  TotalBalancesPerAccount,
  TotalBalances,
  WalletTotalBalancesPerAccount,
} from 'models/TotalBalances';
import type {
  RatesByAssetAddress,
  RatesPerChain,
  Currency,
} from 'models/Rates';

export const walletTotalBalancesPerAccountSelector: Selector<WalletTotalBalancesPerAccount> = createSelector(
  assetsBalancesPerAccountSelector,
  ratesPerChainSelector,
  fiatCurrencySelector,
  (
    assetsBalancesPerAccount: AssetBalancesPerAccount,
    ratesPerChain: RatesPerChain,
    currency: Currency,
  ): WalletTotalBalancesPerAccount =>
    mapRecordValues(assetsBalancesPerAccount, (assetsBalancesPerChain: AccountAssetBalances) =>
      mapChainRecordValues(assetsBalancesPerChain, (assetBalances: CategoryAssetsBalances, chain: Chain) =>
        calculateWalletAssetsFiatValue(
          assetBalances ?? {},
          ratesPerChain[chain] ?? {},
          currency,
        ),
      ),
    ),
);

const storeTotalBalancesPerAccountSelector: Selector<TotalBalancesPerAccount> = createSelector(
  (root: RootReducerState) => root.totalBalances.data,
  usdToFiatRateSelector,
  (storeBalancesPerAccount: TotalBalancesPerAccount, usdToFiatRate: ?number): TotalBalancesPerAccount => {
    return mapAccountCategoryChainRecordValues(
      storeBalancesPerAccount,
      (value) => getFiatValueFromUsd(value, usdToFiatRate) ?? BigNumber(0),
    );
  },
);

export const totalBalancesPerAccountSelector: Selector<TotalBalancesPerAccount> = createSelector(
  walletTotalBalancesPerAccountSelector,
  storeTotalBalancesPerAccountSelector,
  (
    walletBalancesPerAccount: WalletTotalBalancesPerAccount,
    storeBalancesPerAccount: TotalBalancesPerAccount,
  ): TotalBalancesPerAccount => {
    const wrappedWalletBalancesPerAccount = mapRecordValues(walletBalancesPerAccount, (wallet) => ({ wallet }));
    return merge({}, storeBalancesPerAccount, wrappedWalletBalancesPerAccount);
  },
);

export const accountTotalBalancesSelector: Selector<TotalBalances> = createSelector(
  activeAccountIdSelector,
  totalBalancesPerAccountSelector,
  (accountId: ?string, totalBalancesPerAccount: TotalBalances): TotalBalances => {
    if (!accountId) return {};
    return totalBalancesPerAccount[accountId] ?? {};
  },
);

export const accountWalletBalancePerChainSelector: Selector<ChainRecord<BigNumber>> = createSelector(
  activeAccountIdSelector,
  walletTotalBalancesPerAccountSelector,
  (accountId: string, walletBalances: WalletTotalBalancesPerAccount): ChainRecord<BigNumber> => {
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

/**
 * Note: this will return zero for service assets to prevent double counting them.
 */
const calculateWalletAssetsFiatValue = (
  categoryAssetBalances: CategoryAssetsBalances,
  rates: RatesByAssetAddress,
  currency: Currency,
): BigNumber => {
  const assetBalancesInFiat = map(
    categoryAssetBalances.wallet ?? {},
    ({ address, balance }: WalletAssetBalance) => {
      if (!balance) return BigNumber(0);

      const hasMatchingServiceAsset = hasServiceAssetBalanceForAddress(categoryAssetBalances, address);
      if (hasMatchingServiceAsset) return BigNumber(0);

      const rate = getAssetRateInFiat(rates, address, currency);
      return BigNumber(balance).times(rate);
    },
  );

  return sum(assetBalancesInFiat);
};
