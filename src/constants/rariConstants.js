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
import { getRariPoolsEnv } from 'configs/envConfig';

export const SET_RARI_APY = 'SET_RARI_APY';
export const SET_RARI_USER_DATA = 'SET_RARI_USER_DATA';
export const SET_FETCHING_RARI_DATA = 'SET_FETCHING_RARI_DATA';
export const SET_FETCHING_RARI_DATA_ERROR = 'SET_FETCHING_RARI_DATA_ERROR';

export const RARI_POOLS = {
  STABLE_POOL: ('STABLE_POOL': 'STABLE_POOL'),
  YIELD_POOL: ('YIELD_POOL': 'YIELD_POOL'),
  ETH_POOL: ('ETH_POOL': 'ETH_POOL'),
};

export const RARI_POOLS_ARRAY: $Values<typeof RARI_POOLS>[] = Object.keys(RARI_POOLS);

export const RARI_AAVE_ETH_RESERVE_ID =
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0x24a42fd28c976a61df5d00d0599c34c4f90748c8';

export const RARI_TOKENS = {
  DAI: {
    symbol: 'DAI',
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
  USDC: {
    symbol: 'USDC',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    name: 'USD Coin',
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    name: 'Tether USD',
    decimals: 6,
  },
  TUSD: {
    symbol: 'TUSD',
    address: '0x0000000000085d4780b73119b644ae5ecd22b376',
    name: 'TrueUSD',
    decimals: 18,
  },
  BUSD: {
    symbol: 'BUSD',
    address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
    name: 'Binance USD',
    decimals: 18,
  },
  sUSD: {
    symbol: 'sUSD',
    address: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
    name: 'sUSD',
    decimals: 18,
  },
  mUSD: {
    symbol: 'mUSD',
    address: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5',
    name: 'mStable USD',
    decimals: 18,
  },
};

const rariLogo = require('assets/images/rari_logo.png');

export const RARI_TOKENS_DATA = {
  [RARI_POOLS.STABLE_POOL]: {
    symbol: 'RSPT',
    name: 'Rari Stable Pool Token',
    decimals: 18,
    contractAddress: getRariPoolsEnv(RARI_POOLS.STABLE_POOL).RARI_FUND_TOKEN_ADDRESS,
    imageUrl: rariLogo,
  },
  [RARI_POOLS.YIELD_POOL]: {
    symbol: 'RYPT',
    name: 'Rari Yield Pool Token',
    decimals: 18,
    contractAddress: getRariPoolsEnv(RARI_POOLS.YIELD_POOL).RARI_FUND_TOKEN_ADDRESS,
    imageUrl: rariLogo,
  },
  [RARI_POOLS.ETH_POOL]: {
    symbol: 'REPT',
    name: 'Rari ETH Pool Token',
    decimals: 18,
    contractAddress: getRariPoolsEnv(RARI_POOLS.ETH_POOL).RARI_FUND_TOKEN_ADDRESS,
    imageUrl: rariLogo,
  },
};
