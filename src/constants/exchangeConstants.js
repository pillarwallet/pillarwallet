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
export const ADD_OFFER = 'ADD_OFFER';
export const RESET_OFFERS = 'RESET_OFFERS';
export const SET_EXCHANGE_SEARCH_REQUEST = 'SET_EXCHANGE_SEARCH_REQUEST';
export const SET_EXECUTING_TRANSACTION = 'SET_EXECUTING_TRANSACTION';
export const SET_DISMISS_TRANSACTION = 'SET_DISMISS_TRANSACTION';
export const SET_EXCHANGE_ALLOWANCES = 'SET_EXCHANGE_ALLOWANCES';
export const ADD_EXCHANGE_ALLOWANCE = 'ADD_EXCHANGE_ALLOWANCE';
export const UPDATE_EXCHANGE_ALLOWANCE = 'UPDATE_EXCHANGE_ALLOWANCE';
export const SET_EXCHANGE_SUPPORTED_ASSETS = 'SET_EXCHANGE_SUPPORTED_ASSETS';
export const SET_FIAT_EXCHANGE_SUPPORTED_ASSETS = 'SET_FIAT_EXCHANGE_SUPPORTED_ASSETS';
export const SET_UNISWAP_TOKENS_QUERY_STATUS: 'SET_UNISWAP_TOKENS_QUERY_STATUS' = 'SET_UNISWAP_TOKENS_QUERY_STATUS';

export const PROVIDER_UNISWAP = 'UNISWAPV2-SHIM';
export const PROVIDER_1INCH = 'ONEINCH-SHIM';
export const PROVIDER_SYNTHETIX = 'SYNTHETIX';

export const MARK_NOTIFICATION_SEEN = 'MARK_NOTIFICATION_SEEN';

export const EXCHANGE = 'EXCHANGE';

export const SLOW = 'min';
export const NORMAL = 'avg';
export const FAST = 'max';

// mainnet only
export const UNISWAP_SUBGRAPH_NAME = 'uniswap/uniswap-v2';

export const ALLOWED_SLIPPAGE = 3; // 3%

export const UNISWAP_TOKENS_QUERY_STATUS = {
  FETCHING: ('FETCHING': 'FETCHING'),
  SUCCESS: ('SUCCESS': 'SUCCESS'),
  ERROR: ('ERROR': 'ERROR'),
};
