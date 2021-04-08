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

export type WalletInfo = {|
  total: ChainInfo;
  ethereum: ChainInfo,
  binance?: ChainInfo,
  xdai?: ChainInfo,
  polygon?: ChainInfo,
|};

export type ChainInfo = {|
  walletAddress?: string,
  total: BalanceInfo,
  wallet?: BalanceInfo,
  deposits?: BalanceInfo,
  investments?: BalanceInfo,
  liquidityPools?: BalanceInfo,
  rewards?: BalanceInfo,
  datasets?: BalanceInfo,
  collectibles?: number,
  contacts?: number,
|};

export type BalanceInfo = {|
  balanceInFiat: BigNumber,
  changeInFiat?: BigNumber,
|};

export type ChainBalances = {|
  ethereum: CategoryBalances,
  binance?: CategoryBalances,
  xdai?: CategoryBalances,
  polygon?: CategoryBalances,
|};
export type CategoryBalances = {|
  wallet?: Balance,
  deposits?: Balance,
  investments?: Balance,
  liquidityPools?: Balance,
  rewards?: Balance,
  datasets?: Balance,
|};

export type Balance = {|
  balanceInFiat: BigNumber,
  profitInFiat?: ?BigNumber,
|};
