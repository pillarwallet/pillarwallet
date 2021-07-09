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

// constants
import { PLR } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import { isProdEnv } from 'utils/environment';

// types
import type { Chain } from 'models/Chain';


export default {
  ICX: {
    listed: false,
    send: false,
    receive: false,
    disclaimer: 'Unsupported',
  },
  CMT: {
    listed: false,
    send: false,
    receive: false,
    disclaimer: 'Unsupported',
  },
};

export const PPN_TOKEN = PLR;

/* eslint-disable i18next/no-literal-string */
export const getPlrAddressForChain = (chain: Chain): string => {
  if (chain === CHAIN.BINANCE) return '0x790cfdc6ab2e0ee45a433aac5434f183be1f6a20';
  if (chain === CHAIN.POLYGON) return '0xa6b37fc85d870711c56fbcb8afe2f8db049ae774';
  if (chain === CHAIN.XDAI) return ''; // TODO: to be added

  // Ethereum
  return isProdEnv()
    ? '0xe3818504c1b32bf1557b16c238b2e01fd3149c17'
    : '0xdd3122831728404a7234e5981677a5fd0a9727fe';
};
/* eslint-enable i18next/no-literal-string */
