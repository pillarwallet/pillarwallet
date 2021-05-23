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

// types
import type { ChainRecord } from 'models/Chain';

export type CategoryTotalBalances = {|
  wallet?: BigNumber,
  deposits?: BigNumber,
  investments?: BigNumber,
  liquidityPools?: BigNumber,
  rewards?: BigNumber,
|};

export type CategoryTotalBalancesPerChain = ChainRecord<CategoryTotalBalances>;

export type ChainTotalBalancesPerAccount = {
  [accountId: string]: CategoryTotalBalancesPerChain,
};

export type CategoryAssetsBalances = {|
  wallet?: WalletAssetsBalances,
  deposits?: DepositAssetBalance[],
  investments?: InvestmentAssetBalance[],
  liquidityPools?: LiquidityPoolAssetBalance[],
  rewards?: WalletAssetsBalances,
|};

export type LiquidityPoolAssetBalance = {|
  key: string,
  service: string,
  title: string,
  value: BigNumber,
  iconUrl: ?string,
  share?: BigNumber,
  change?: BigNumber,
|};

export type InvestmentAssetBalance = {|
  key: string,
  service: string,
  title: string,
  iconUrl: ?string,
  value: BigNumber,
  change?: BigNumber,
|};

export type DepositAssetBalance = {|
  key: string,
  service: string,
  title: string,
  value: BigNumber,
  iconUrl: ?string,
  change?: BigNumber,
  currentApy?: BigNumber,
|};

export type WalletAssetBalance = {|
  balance: string,
  symbol: string,
|};

export type WalletAssetsBalances = {
  [symbol: string]: WalletAssetBalance,
};

export type AssetsBalances = WalletAssetsBalances
  | LiquidityPoolAssetBalance[]
  | InvestmentAssetBalance[]
  | DepositAssetBalance[];

export type AssetBalancesPerAccount = {
  [accountId: string]: AssetsBalances,
};

export type CategoryBalancesPerChain = ChainRecord<CategoryAssetsBalances>;

export type ChainBalancesPerAccount = {
  [accountId: string]: CategoryBalancesPerChain,
};

export type TotalBalancesPerChain = ChainRecord<BigNumber>;

export type AssetsBalancesPerChain = ChainRecord<AssetsBalances>;

export type CollectibleCountPerChain = ChainRecord<number>;
