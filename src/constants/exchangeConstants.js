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

export const EXCHANGE_PROVIDER = {
  UNISWAP: ('Uniswap': 'Uniswap'),
  ONE_INCH: ('OneInch': 'OneInch'),
  SYNTHETIX: ('Synthetix': 'Synthetix'),
  SUSHISWAP: ('Sushiswap': 'Sushiswap'),
  HONEYSWAP: ('Honeyswap': 'Honeyswap'),
  PARASWAP: ('Paraswap': 'Paraswap'),
  LIFI: ('Lifi': 'Lifi'),
};

// Hardcoded in Etherspot backend
export const ALLOWED_SLIPPAGE = 1; // 1%

// deprecated: WBTC.Cafe
export const WBTC_PENDING_TRANSACTION = 'WBTC_PENDING_TRANSACTION';
export const WBTC_SETTLED_TRANSACTION = 'WBTC_SETTLED_TRANSACTION';

export const BRIDGE_CATEGORY = {
  EXCHANGE: ('Exchange': 'Exchange'),
  CROSS_CHAIN: ('Cross-chain': 'Cross-chain'),
};

export const TRANSACTION_NOTIFICATION_DATA = 'TRANSACTION_NOTIFICATION_DATA';

export const OFFERS = 'OFFERS';

export const ADD_EXCHANGE_GAS_FEE_INFO = 'ADD_EXCHANGE_GAS_FEE_INFO';
export const RESET_EXCHANGE_GAS_FEE_INFO = 'RESET_EXCHANGE_GAS_FEE_INFO';
