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

export const CHAIN = {
  ETHEREUM: ('ethereum': 'ethereum'),
  POLYGON: ('polygon': 'polygon'),
  BINANCE: ('binance': 'binance'),
  XDAI: ('xdai': 'xdai'),
};

export type Chain = $Values<typeof CHAIN>;

export type ChainRecord<T> = {|
  polygon?: T,
  binance?: T,
  xdai?: T,
  ethereum?: T,
|};

// Based on: https://chainid.network/
export const CHAIN_ID = {
  ETHEREUM: '1',
  BINANCE: '56',
  XDAI: '100',
  POLYGON: '137',
};

/* eslint-disable quote-props */
export const chainFromChainId = {
  [CHAIN_ID.ETHEREUM]: CHAIN.ETHEREUM,
  [CHAIN_ID.BINANCE]: CHAIN.BINANCE,
  [CHAIN_ID.XDAI]: CHAIN.XDAI,
  [CHAIN_ID.POLYGON]: CHAIN.POLYGON,
};
