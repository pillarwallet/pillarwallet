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
import { getEnv } from 'configs/envConfig';
import { STAGING } from 'constants/envConstants';
import { LIQUIDITY_POOL_TYPES } from 'models/LiquidityPools';

export const SET_FETCHING_LIQUIDITY_POOLS_DATA = 'SET_FETCHING_LIQUIDITY_POOLS_DATA';
export const SET_UNIPOOL_DATA = 'SET_UNIPOOL_DATA';
export const SET_UNISWAP_POOL_DATA = 'SET_UNISWAP_POOL_DATA';
export const SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR = 'SET_LIQUIDITY_POOLS_GRAPH_QUERY_ERROR';
export const SET_SHOWN_STAKING_ENABLED_MODAL = 'SET_SHOWN_STAKING_ENABLED_MODAL';

export const LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION = 'LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION';
export const LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION = 'LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION';
export const LIQUIDITY_POOLS_STAKE_TRANSACTION = 'LIQUIDITY_POOLS_STAKE_TRANSACTION';
export const LIQUIDITY_POOLS_UNSTAKE_TRANSACTION = 'LIQUIDITY_POOLS_UNSTAKE_TRANSACTION';
export const LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION = 'LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION';


export const LIQUIDITY_POOLS = () => getEnv().ENVIRONMENT === STAGING ?
  [
    {
      name: 'Uniswap v2 ETH/PLR',
      type: LIQUIDITY_POOL_TYPES.UNIPOOL,
      symbol: 'UNI-V2',
      tokensProportions: [
        { symbol: 'ETH', proportion: 0.5, progressBarColor: '#497391' },
        { symbol: 'PLR', proportion: 0.5, progressBarColor: '#00ff24' },
      ],
      rewards: [
        { symbol: 'PLR', amount: 49999 },
      ],
      uniswapPairAddress: '0xddA2eCA2c9cB356ECd9b0135951ffBf5d577401D',
      unipoolAddress: '0xFfD8C07309d3A3ce473Feb1d98ebF1F3171A83d9',
      unipoolSubgraphName: 'graszka22/unipool-plr-eth-kovan',
      iconUrl: 'asset/images/tokens/icons/ethplruniColor.png',
      rewardsEnabled: true,
    },
  ] : [
    {
      name: 'Uniswap v2 ETH/PLR',
      type: LIQUIDITY_POOL_TYPES.UNIPOOL,
      symbol: 'UNI-V2',
      tokensProportions: [
        { symbol: 'ETH', proportion: 0.5, progressBarColor: '#497391' },
        { symbol: 'PLR', proportion: 0.5, progressBarColor: '#00ff24' },
      ],
      rewards: [
        { symbol: 'PLR', amount: 49999 },
      ],
      uniswapPairAddress: '0xae2d4004241254aed3f93873604d39883c8259f0',
      unipoolAddress: '0x32105017918Cb9CD9A5f21fd6984Ee7DC82B9E7E',
      unipoolSubgraphName: 'graszka22/unipool-plr-eth',
      iconUrl: 'asset/images/tokens/icons/ethplruniColor.png',
      rewardsEnabled: true,
    },
    {
      name: 'Uniswap v2 DAI/PLR',
      type: LIQUIDITY_POOL_TYPES.UNIPOOL,
      symbol: 'UNIv2',
      tokensProportions: [
        { symbol: 'DAI', proportion: 0.5, progressBarColor: '#FABA34' },
        { symbol: 'PLR', proportion: 0.5, progressBarColor: '#00ff24' },
      ],
      rewards: [
        { symbol: 'PLR', amount: 29999 },
      ],
      uniswapPairAddress: '0x025d34acfd5c65cfd5a73209f99608c9e13338f3',
      unipoolAddress: '0x71B4A17E4254F85420B06bC55f431A5EEb97E7fB',
      unipoolSubgraphName: 'graszka22/unipool-plr-dai',
      iconUrl: 'asset/images/tokens/icons/daiplrColor.png',
      rewardsEnabled: true,
    },
    {
      name: 'Uniswap v2 USDC/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'USDC-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'USDC', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 ETH/USDT',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'ETH-USDT UNI-V2',
      tokensProportions: [
        { symbol: 'ETH', proportion: 0.5 },
        { symbol: 'USDT', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 DAI/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'DAI-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'DAI', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 WBTC/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'WBTC-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'WBTC', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xbb2b8038a1640196fbe3e38816f3e67cba72d940',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 UNI/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'UNI-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'UNI', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xd3d2e2692501a5c9ca623199d38826e513033a17',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 YFI/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'YFI-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'YFI', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x2fdbadf3c4d5a8666bc06645b8358ab803996e28',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 ETH/AMPL',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'ETH-AMPL UNI-V2',
      tokensProportions: [
        { symbol: 'ETH', proportion: 0.5 },
        { symbol: 'AMPL', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xc5be99a02c6857f9eac67bbce58df5572498f40c',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 LINK/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'LINK-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'LINK', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xa2107fa5b38d9bbd2c461d6edf11b11a50f6b974',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 SUSHI/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'SUSHI-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'SUSHI', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xce84867c3c02b05dc570d0135103d3fb9cc19433',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 TEND/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'TEND-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'TEND', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xcfb8cf118b4f0abb2e8ce6dbeb90d6bc0a62693d',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 CORE/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'CORE-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'CORE', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x32ce7e48debdccbfe0cd037cc89526e4382cb81b',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 KP3R/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'KP3R-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'KP3R', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x87febfb3ac5791034fd5ef1a615e9d9627c2665d',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 DAI/BAS',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'DAI-BAS UNI-V2',
      tokensProportions: [
        { symbol: 'DAI', proportion: 0.5 },
        { symbol: 'BAS', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x0379da7a5895d13037b6937b109fa8607a659adf',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 BAC/DAI',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'BAC-DAI UNI-V2',
      tokensProportions: [
        { symbol: 'BAC', proportion: 0.5 },
        { symbol: 'DAI', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xd4405f0704621dbe9d4dea60e128e0c3b26bddbd',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 ESD/USDC',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'ESD-USDC UNI-V2',
      tokensProportions: [
        { symbol: 'ESD', proportion: 0.5 },
        { symbol: 'USDC', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x88ff79eb2bc5850f27315415da8685282c7610f9',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 USDC/DSD',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'USDC-DSD UNI-V2',
      tokensProportions: [
        { symbol: 'USDC', proportion: 0.5 },
        { symbol: 'DSD', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x66e33d2605c5fb25ebb7cd7528e7997b0afa55e8',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 SNX/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'SNX-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'SNX', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x43ae24960e5534731fc831386c07755a2dc33d47',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 PICKLE/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'PICKLE-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'PICKLE', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xdc98556ce24f007a5ef6dc1ce96322d65832a819',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 AAVE/ETH',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'AAVE-ETH UNI-V2',
      tokensProportions: [
        { symbol: 'AAVE', proportion: 0.5 },
        { symbol: 'ETH', proportion: 0.5 },
      ],
      uniswapPairAddress: '0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f',
      iconUrl: '',
    },
    {
      name: 'Uniswap v2 USDC/USDT',
      type: LIQUIDITY_POOL_TYPES.UNISWAP,
      symbol: 'USDC-USDT UNI-V2',
      tokensProportions: [
        { symbol: 'USDC', proportion: 0.5 },
        { symbol: 'USDT', proportion: 0.5 },
      ],
      uniswapPairAddress: '0x3041cbd36888becc7bbcbc0045e3b1f144466f5f',
      iconUrl: '',
    },
  ];

export const UNISWAP_FEE_RATE = 0.003;
