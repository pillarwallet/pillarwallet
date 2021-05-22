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

// constants
import { CHAIN } from 'models/Chain';

// types
import type { ChainRecord } from 'models/Chain';


export type Chain = $Values<typeof CHAIN>;

export type CategoryTotalBalancesPerChain = ChainRecord<CategoryTotalBalances>;

export type CategoryBalancesPerChain = ChainRecord<CategoryBalances>;

export type CategoryTotalBalances = {|
  wallet?: BigNumber,
  deposits?: BigNumber,
  investments?: BigNumber,
  liquidityPools?: BigNumber,
  rewards?: BigNumber,
|};

export type CategoryBalances = {|
  wallet?: Balances,
  deposits?: Balances,
  investments?: Balances,
  liquidityPools?: Balances,
  rewards?: Balances,
|};

export type ChainTotalBalancesPerAccount = {
  [accountId: string]: CategoryTotalBalancesPerChain,
};

export type ChainBalancesPerAccount = {
  [accountId: string]: CategoryBalancesPerChain,
};

export type TotalBalancesPerChain = ChainRecord<BigNumber>;

export type CollectibleCountPerChain = ChainRecord<number>;

export type Balance = {
  balance: string,
  symbol: string,
};

export type Balances = {
  [symbol: string]: Balance,
};

export type MixedBalance = {
  balance: number | string,
  symbol: string,
};

export type MixedBalances = {
  [symbol: string]: MixedBalance,
};

export type BalancesStore = {
  [accountId: string]: Balances,
};
