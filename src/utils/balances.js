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
import { pickBy } from 'lodash';

// Utils
import { mapChainRecordValues } from 'utils/chains';

// Types
import type {
  CategoryBalancesPerChain,
  WalletAssetBalance,
  WalletAssetsBalances,
  ServiceAssetBalance,
} from 'models/Balances';
import type { ChainRecord } from 'models/Chain';

export const getChainWalletAssetsBalances = (
  assetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<WalletAssetsBalances> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) =>
    filterNonZeroAssetBalances(categoryBalances?.wallet ?? {}),
  );

export const getChainDepositAssetsBalances = (
  assetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<ServiceAssetBalance[]> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) => categoryBalances?.deposits ?? []);

export const getChainLiquidityPoolAssetsBalances = (
  assetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<ServiceAssetBalance[]> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) => categoryBalances?.liquidityPools ?? []);

export const getChainInvestmentAssetsBalances = (
  assetsBalances: ?CategoryBalancesPerChain,
): ChainRecord<ServiceAssetBalance[]> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) => categoryBalances?.investments ?? []);

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
