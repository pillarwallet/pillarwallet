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
import type { AccountRecord } from 'models/Account';
import type { ChainRecord } from 'models/Chain';

/**
 * Total balances are represented in top-down nesting:
 *  - level 1. Account
 *  - level 2. Category
 *  - level 3. Chain
 *
 * This hierarchy represents the order in which they are most frequently used.
 */

// Category balances are calculated using selectors in redux
export type CategoryRecord<T> = {|
  wallet: T,
  deposits: T,
  investments: T,
  liquidityPools: T,
  rewards: T,
|};

export type TotalBalances = AccountRecord<AccountTotalBalances>;
export type AccountTotalBalances = CategoryRecord<ChainRecord<BigNumber>>;

// Stored balances are stored directly in redux
export type StoreRecord<T> = {|
  deposits?: T,
  investments?: T,
  liquidityPools?: T,
  rewards?: T,
|};

export type StoreTotalBalances = AccountRecord<StoreAccountTotalBalances>;
export type StoreAccountTotalBalances = StoreRecord<ChainRecord<BigNumber>>;

// Wallet balances are calculated using selectors in redux
export type WalletTotalBalances = AccountRecord<ChainRecord<BigNumber>>;
