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
  AVALANCHE: ('avalanche': 'avalanche'),
};

export const CHAIN_NAMES = {
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  BINANCE: 'binance',
  XDAI: 'xdai',
  AVALANCHE: 'avalanche',
};

export const CHAIN_SHORT = {
  ETHEREUM: 'Mainnet',
  POLYGON: 'Polygon',
  BINANCE: 'BSC',
  XDAI: 'xDai',
  AVALANCHE: 'AVAX',
};

// Based on: https://chainid.network/
export const CHAIN_ID = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_KOVAN: 42,
  POLYGON: 137,
  BINANCE: 56,
  XDAI: 100,
  AVALANCHE: 43114,
  FUJI: 43113,
  MUMBAI: 80001,
};

export const CHAIN_WITH_ID = [
  { name: 'ethereum', chainId: 1 },
  { name: 'kovan', chainId: 42 },
  { name: 'polygon', chainId: 137 },
  { name: 'binance', chainId: 56 },
  { name: 'xdai', chainId: 100 },
  { name: 'avalanche', chainId: 43114 },
  { name: 'fuji', chainId: 43113 },
  { name: 'mumbai', chainId: 80001 },
];
