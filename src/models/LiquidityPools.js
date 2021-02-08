// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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

import type { BigNumber } from 'bignumber.js';

export const LIQUIDITY_POOLS_TYPES = {
  UNIPOOL: ('UNIPOOL': 'UNIPOOL'),
};

export type LiquidityPoolType = $Values<typeof LIQUIDITY_POOLS_TYPES>;

export type LiquidityPoolBase = {
  type: LiquidityPoolType,
  name: string,
  symbol: string,
  tokensProportions: {
    symbol: string,
    proportion: number
  }[],
  rewards: {
    symbol: string,
    amount: number,
  }[],
  iconUrl: string,
  rewardsEnabled: boolean,
};

export type UnipoolLiquidityPool = LiquidityPoolBase & {
  type: typeof LIQUIDITY_POOLS_TYPES.UNIPOOL,
  uniswapPairAddress: string,
  unipoolAddress: string,
  unipoolSubgraphName: string,
};

export type LiquidityPool = UnipoolLiquidityPool;

export type LiquidityPoolStats = {
  currentPrice: number,
  dayPriceChange: number,
  weekPriceChange: number,
  monthPriceChange: number,
  volume: number,
  totalLiquidity: number,
  dailyVolume: number,
  dailyFees: number,
  tokensLiquidity: {[string]: number },
  stakedAmount: BigNumber,
  rewardsToClaim: number,
  tokensPrices: {[string]: number },
  tokensPricesUSD: {[string]: number },
  tokensPerLiquidityToken: {[string]: number },
  totalSupply: number,
  history: {date: Date, value: number}[],
  userLiquidityTokenBalance: BigNumber,
};
