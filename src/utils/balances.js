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
import { findAllAssetsBySymbol, addressesEqual } from 'utils/assets';
import { mapChainRecordValues } from 'utils/chains';

// Types
import type { Asset } from 'models/Asset';
import type {
  AccountAssetBalances,
  WalletAssetBalance,
  WalletAssetsBalances,
  ServiceAssetBalance,
  CategoryAssetsBalances,
} from 'models/Balances';
import type { ChainRecord } from 'models/Chain';

export const getChainWalletAssetsBalances = (
  assetsBalances: ?AccountAssetBalances,
): ChainRecord<WalletAssetsBalances> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) =>
    filterNonZeroAssetBalances(categoryBalances?.wallet ?? {}),
  );

export const getChainDepositAssetsBalances = (
  assetsBalances: ?AccountAssetBalances,
): ChainRecord<ServiceAssetBalance[]> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) => categoryBalances?.deposits ?? []);

export const getChainLiquidityPoolAssetsBalances = (
  assetsBalances: ?AccountAssetBalances,
): ChainRecord<ServiceAssetBalance[]> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) => categoryBalances?.liquidityPools ?? []);

export const getChainInvestmentAssetsBalances = (
  assetsBalances: ?AccountAssetBalances,
): ChainRecord<ServiceAssetBalance[]> =>
  mapChainRecordValues(assetsBalances ?? {}, (categoryBalances) => categoryBalances?.investments ?? []);

export const getWalletAssetsSymbols = (accountAssetsBalances: ?AccountAssetBalances): string[] => {
  const walletAssetsBalancesPerChain = getChainWalletAssetsBalances(accountAssetsBalances);

  return Object.keys(walletAssetsBalancesPerChain).flatMap((chain) => {
    const walletAssetsBalances = walletAssetsBalancesPerChain[chain];
    return Object.keys(walletAssetsBalances ?? {});
  });
};

export const filterNonZeroAssetBalances = (balances: WalletAssetsBalances): WalletAssetsBalances => {
  return pickBy(balances, ({ balance }: WalletAssetBalance) => !!balance && !BigNumber(balance).isZero());
};

export const findServiceAssetBalance = (
  balances: ?(ServiceAssetBalance[]),
  addressToFind: string,
): ServiceAssetBalance | void => {
  return balances?.find((asset) => addressesEqual(asset.address, addressToFind));
};

/**
 * Check if user has service asset balances for given asset symbol.
 *
 * Note: given symbol may correspond to 1+ supported asset, so we need to pick them from supported assets.
 */
export const hasServiceAssetBalanceForSymbol = (
  assetBalances: CategoryAssetsBalances,
  supportedAssets: Asset[],
  symbol: string,
): boolean => {
  const matchingSupportedAssets = findAllAssetsBySymbol(supportedAssets, symbol);

  return matchingSupportedAssets.some(
    (asset) =>
      findServiceAssetBalance(assetBalances.deposits, asset.address) ??
      findServiceAssetBalance(assetBalances.investments, asset.address) ??
      findServiceAssetBalance(assetBalances.liquidityPools, asset.address),
  );
};
