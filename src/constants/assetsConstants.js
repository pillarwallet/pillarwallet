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
export const FETCHED = 'FETCHED';
export const FETCHING = 'FETCHING';
export const FETCHING_INITIAL = 'FETCHING_INITIAL';
export const FETCH_INITIAL_FAILED = 'FETCH_INITIAL_FAILED';
export const FETCHED_INITIAL = 'FETCHED_INITIAL';
export const UPDATE_ASSET = 'UPDATE_ASSET';
export const UPDATE_ASSETS = 'UPDATE_ASSETS';
export const UPDATE_ASSETS_STATE = 'UPDATE_ASSETS_STATE';
export const START_ASSETS_SEARCH = 'START_ASSETS_SEARCH';
export const UPDATE_ASSETS_SEARCH_RESULT = 'UPDATE_ASSETS_SEARCH_RESULT';
export const RESET_ASSETS_SEARCH_RESULT = 'RESET_ASSETS_SEARCH_RESULT';
export const SET_INITIAL_ASSETS = 'SET_INITIAL_ASSETS';
export const UPDATE_SUPPORTED_ASSETS = 'UPDATE_SUPPORTED_ASSETS';
export const UPDATE_BALANCES = 'UPDATE_BALANCES';

// fiat
export const EUR = 'EUR';
export const GBP = 'GBP';
export const USD = 'USD';

// token symbols
export const ETH = 'ETH';
export const PLR = 'PLR';
export const HOT = 'HOT';
export const HOLO = 'HOLO';
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

export const TOKENS = 'TOKENS';
export const COLLECTIBLES = 'COLLECTIBLES';
export const BADGES = 'BADGES';
export const SYNTHETIC = 'SYNTHETIC';
export const NONSYNTHETIC = 'NONSYNTHETIC';
export const ETHEREUM_ADDRESS_PREFIX = 'ethereum';

export const defaultFiatCurrency = GBP;
export const supportedFiatCurrencies = [GBP, EUR, USD];

export const DEFAULT_ACCOUNTS_ASSETS_DATA_KEY = 'default';
export const VISIBLE_NUMBER_DECIMALS = 18;

export const POPULAR_EXCHANGE_TOKENS = [
  ETH, PLR, LINK, BAT, PPT, AE, DAI, KNC, MKR, USDT, VERI, BNT, OMG, WAX, ZIL, ZRX,
];

export const HIGH_VALUE_TOKENS = [
  YFI, WBTC, sBTC, BTC, iBTC, renBTC, tBTC, OBTC, wBTC, testBTC,
];

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
