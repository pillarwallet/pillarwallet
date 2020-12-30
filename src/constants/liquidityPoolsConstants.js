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
import { LIQUIDITY_POOLS_TYPES } from 'models/LiquidityPools';

export const SET_FETCHING_LIQUIDITY_POOLS_DATA = 'SET_FETCHING_LIQUIDITY_POOLS_DATA';
export const SET_UNIPOOL_DATA = 'SET_UNIPOOL_DATA';
export const SET_UNISWAP_POOL_DATA = 'SET_UNISWAP_POOL_DATA';
export const SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR = 'SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR';
export const SET_LIQUIDITY_POOLS_DATA_FETCHED = 'SET_LIQUIDITY_POOLS_DATA_FETCHED';

export const LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION = 'LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION';
export const LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION = 'LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION';
export const LIQUIDITY_POOLS_STAKE_TRANSACTION = 'LIQUIDITY_POOLS_STAKE_TRANSACTION';
export const LIQUIDITY_POOLS_UNSTAKE_TRANSACTION = 'LIQUIDITY_POOLS_UNSTAKE_TRANSACTION';
export const LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION = 'LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION';

export const LIQUIDITY_POOLS = [
  {
    name: 'Uniswap v2 ETH/PLR',
    type: LIQUIDITY_POOLS_TYPES.UNIPOOL,
    symbol: 'UNI-V2',
    tokensProportions: [
      { symbol: 'ETH', proportion: 0.5, progressBarColor: '#497391' },
      { symbol: 'PLR', proportion: 0.5, progressBarColor: '#00ff24' },
    ],
    rewards: [
      { symbol: 'PLR', amount: 100000 },
    ],
    uniswapPairAddress: '0xddA2eCA2c9cB356ECd9b0135951ffBf5d577401D',
    unipoolAddress: '0xFfD8C07309d3A3ce473Feb1d98ebF1F3171A83d9',
    unipoolSubgraphName: 'graszka22/unipool-plr-eth-kovan',
    iconUrl: 'asset/images/tokens/icons/ethplruniColor.png',
  },
  /*
  {
    name: 'Uniswap v2 DAI/PLR',
    tokens: [
      { symbol: 'DAI', proportion: 0.5 },
      { symbol: 'PLR', proportion: 0.5 },
    ],
    rewards: [
      { symbol: 'PLR', amount: 100000 },
    ],
    uniswapPairAddress: '0x025d34acfd5c65cfd5a73209f99608c9e13338f3',
    unipoolAddress: '0x71B4A17E4254F85420B06bC55f431A5EEb97E7fB',
    iconUrl: 'asset/images/tokens/icons/ethplruniColor.png',
  },
  */
];
