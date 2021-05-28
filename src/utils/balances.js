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
import { mapValues, pickBy } from 'lodash';

// Constants
import { ASSET_CATEGORY } from 'constants/assetsConstants';

// Types
import type {
  CategoryBalancesPerChain,
  WalletAssetBalance,
  WalletAssetsBalances,
  DepositAssetBalance,
  InvestmentAssetBalance,
  LiquidityPoolAssetBalance,
} from 'models/Balances';
import type { ChainRecord } from 'models/Chain';

export const getChainWalletAssetsBalances = (
  assetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<WalletAssetsBalances> => {
  return mapValues(assetsBalances ?? {}, (categoryBalances) =>
    filterNonZeroAssetBalances(categoryBalances?.wallet ?? {}),
  );
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

export const getWalletAssetsSymbols = (accountAssetsBalances: ?CategoryBalancesPerChain): string[] => {
  const walletAssetsBalancesPerChain = getChainWalletAssetsBalances(accountAssetsBalances);

  return Object.keys(walletAssetsBalancesPerChain).flatMap((chain) => {
    const walletAssetsBalances = walletAssetsBalancesPerChain[chain];
    return Object.keys(walletAssetsBalances ?? {});
  });
};

export const filterNonZeroAssetBalances = (balances: WalletAssetsBalances): WalletAssetsBalances => {
  return pickBy(balances, ({ balance }: WalletAssetBalance) => !!balance && !BigNumber(balance).isZero());
};
