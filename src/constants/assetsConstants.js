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
import { ethers } from 'ethers';

// reducer
export const SET_SUPPORTED_ASSETS = 'SET_SUPPORTED_ASSETS';
export const SET_CHAIN_SUPPORTED_ASSETS = 'SET_CHAIN_SUPPORTED_ASSETS';

// fiat
export const USD = ('USD': 'USD');
export const EUR = ('EUR': 'EUR');
export const GBP = ('GBP': 'GBP');

// token symbols
export const ETH = ('ETH': 'ETH');
export const PLR = 'PLR';

export const MATIC = 'MATIC';
export const BNB = 'BNB';
export const XDAI = 'XDAI';
export const OP = 'OP';

export const NFT = 'NFT';

export const SNX = 'SNX';
export const RSPT = 'RSPT';
export const WETH = 'WETH';
const LINK = 'LINK';
const BAT = 'BAT';
const AE = 'AE';
const MKR = 'MKR';
export const USDT = 'USDT';
export const USDC = 'USDC';
const PPT = 'PPT';
export const DAI = 'DAI';
export const BUSD = 'BUSD';
const KNC = 'KNC';
const VERI = 'VERI';
const BNT = 'BNT';
const OMG = 'OMG';
const WAX = 'WAX';
const ZIL = 'ZIL';
const ZRX = 'ZRX';
export const TUSD = 'TUSD';
export const mUSD = 'mUSD';
const YFI = 'YFI';
export const FIO = 'FIO';

// BTC tokens
export const BTC = 'BTC';
export const WBTC = 'WBTC';
const sBTC = 'sBTC';
const iBTC = 'iBTC';
const renBTC = 'renBTC';
const tBTC = 'tBTC';
const OBTC = 'OBTC';
const wBTC = 'wBTC'; // testnet
const testBTC = 'testBTC'; // testnet

export const ETHEREUM = 'ETHEREUM';
export const POLYGON = 'POLYGON';
export const ARBITRUM = 'ARBITRUM';
export const GNOSIS = 'GNOSIS';
export const BSC = 'BSC';

export const ASSET_TYPES = {
  TOKEN: ('TOKENS': 'TOKENS'),
  COLLECTIBLE: ('COLLECTIBLES': 'COLLECTIBLES'),
};

export const SYNTHETIC = 'SYNTHETIC';
export const NONSYNTHETIC = 'NONSYNTHETIC';
export const ETHEREUM_ADDRESS_PREFIX = 'ethereum';

export const defaultFiatCurrency = USD;
export const supportedFiatCurrencies = [GBP, USD, EUR];

export const rateKeys = [USD, EUR, GBP, ETH];

export const DEFAULT_ACCOUNTS_ASSETS_DATA_KEY = 'default';
export const VISIBLE_NUMBER_DECIMALS = 18;

export const POPULAR_EXCHANGE_TOKENS = [
  ETH,
  PLR,
  LINK,
  BAT,
  PPT,
  AE,
  DAI,
  KNC,
  MKR,
  USDT,
  VERI,
  BNT,
  OMG,
  WAX,
  ZIL,
  ZRX,
];

export const HIGH_VALUE_TOKENS = [YFI, WBTC, sBTC, BTC, iBTC, renBTC, tBTC, OBTC, wBTC, testBTC];

export const SPEED_TYPES = {
  SLOW: 'min',
  NORMAL: 'avg',
  FAST: 'max',
};

export const SPEED_TYPE_LABELS = {
  [SPEED_TYPES.SLOW]: 'Slow',
  [SPEED_TYPES.NORMAL]: 'Normal',
  [SPEED_TYPES.FAST]: 'Fast',
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  GBP: '£',
  EUR: '€',
};

export const ASSET_CATEGORY = {
  WALLET: ('wallet': 'wallet'),
  DEPOSITS: ('deposits': 'deposits'),
  INVESTMENTS: ('investments': 'investments'),
  LIQUIDITY_POOLS: ('liquidityPools': 'liquidityPools'),
  COLLECTIBLES: ('collectibles': 'collectibles'),
  APPS: ('apps': 'apps'),
  REWARDS: ('rewards': 'rewards'),
};

export const ADDRESS_ZERO = ethers.constants.AddressZero;

export const ROOT_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export const PLR_ADDRESS_BSC = '0x790cfdc6ab2e0ee45a433aac5434f183be1f6a20';
export const PLR_ADDRESS_POLYGON = '0xa6b37fc85d870711c56fbcb8afe2f8db049ae774';
export const PLR_ADDRESS_XDAI = ''; // TODO: to be added when available
export const PLR_ADDRESS_ETHEREUM_MAINNET = '0xe3818504c1b32bf1557b16c238b2e01fd3149c17';
export const PLR_ADDRESS_ETHEREUM_KOVAN_TESTNET = '0xdd3122831728404a7234e5981677a5fd0a9727fe';

export const CMC_STABLE_COINS = 'CmcStableCoins';

export const ETHERSPOT_STABLE_COIN = 'EtherspotStableCoins';
export const NFT_FLAG = 'NFT_FLAG';
export const ETHERSPOT_POPULAR_TOKENS = 'EtherspotPopularTokens';

export const ADD_TOKENS_FETCHING = 'ADD_TOKENS_FETCHING';
export const IS_ADD_TOKENS_FETCHED = 'IS_ADD_TOKENS_FETCHED';
export const ADD_TOKENS_LIST = 'ADD_TOKENS_LIST';

export const ADD_CUSTOM_TOKEN = 'ADD_CUSTOM_TOKEN';
export const ETHERSPOT_DEFAULT_LIST = 'EtherspotDefaultList';
export const ETHERSPOT_DEFAULT_STABLE_LIST = 'EtherspotDefaultStablesList';

export const FETCHING_DEFAULT_LIST = 'FETCHING_DEFAULT_LIST';
export const SET_DEFAULT_LIST = 'SET_DEFAULT_LIST';
export const SET_STABLE_DEFAULT_LIST = 'SET_STABLE_DEFAULT_LIST';

export const ETHERSPOT_POPULAR_MULTICHAIN = 'EtherspotPopularMultichain';

// Token analytics period types
export const ONE_DAY = '1d';
export const ONE_WEEK = '1w';
export const ONE_MONTH = '1m';
export const ONE_YEAR = '1y';
