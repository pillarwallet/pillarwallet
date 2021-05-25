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
import { mapValues } from 'lodash';
import { BigNumber } from 'bignumber.js';

// constants
import { ASSET_CATEGORY } from 'constants/assetsConstants';

// utils
import { sum } from 'utils/bigNumber';

// types
import type {
  CategoryBalancesPerChain,
  CategoryTotalBalancesPerChain,
  InvestmentAssetBalance,
  LiquidityPoolAssetBalance,
  TotalBalancesPerChain,
  WalletAssetsBalances,
  DepositAssetBalance,
} from 'models/Balances';
import type { ChainRecord } from 'models/Chain';

export const getChainTotalBalancesForCategory = (
  accountTotalBalances: ?CategoryTotalBalancesPerChain,
  category: string,
): TotalBalancesPerChain => mapValues(
  accountTotalBalances ?? {},
  (categoryBalances) => categoryBalances?.[category] || BigNumber(0),
);

export const getTotalBalance = (entries: { [key: string]: BigNumber}): BigNumber => {
  const balances = Object.keys(entries).map((key) => entries[key] || BigNumber(0));
  return sum(balances);
};

export const getTotalCategoryBalance = (
  accountTotalBalances: ?CategoryTotalBalancesPerChain,
  category: string,
): BigNumber => {
  const balancesOnChains = (Object.values(accountTotalBalances || {}): any);

  return sum(balancesOnChains.map((chainTotals) => {
    return chainTotals?.[category] || BigNumber(0);
  }));
};

export const getChainDepositAssetsBalances = (
  accountAssetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<DepositAssetBalance[]> => mapValues(
  accountAssetsBalances ?? {},
  (categoryBalances) => categoryBalances?.[ASSET_CATEGORY.DEPOSITS],
);

export const getChainLiquidityPoolAssetsBalances = (
  accountAssetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<LiquidityPoolAssetBalance[]> => mapValues(
  accountAssetsBalances ?? {},
  (categoryBalances) => categoryBalances?.[ASSET_CATEGORY.LIQUIDITY_POOLS],
);

export const getChainInvestmentAssetsBalances = (
  accountAssetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<InvestmentAssetBalance[]> => mapValues(
  accountAssetsBalances ?? {},
  (categoryBalances) => categoryBalances?.[ASSET_CATEGORY.INVESTMENTS],
);

export const getChainWalletAssetsBalances = (
  accountAssetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<WalletAssetsBalances> => mapValues(
  accountAssetsBalances ?? {},
  (categoryBalances) => categoryBalances?.[ASSET_CATEGORY.WALLET],
);
