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
/* eslint-disable i18next/no-literal-string */

export const initialAssets = [
  {
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
    iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/ethColor.png',
    email: 'mailto://info@pillarproject.io',
    telegram: '',
    twitter: 'https://twitter.com/PillarWallet',
    website: 'https://www.ethereum.org/',
    whitepaper: '',
    isDefault: true,
    balance: 0,
  },
  {
    address: '0x9471ea41772925e3ff477772681740c9f520d3af',
    decimals: 18,
    name: 'Pillar',
    symbol: 'PLR',
    iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/plrColor.png',
    email: 'mailto://info@pillarproject.io',
    telegram: '',
    twitter: 'https://twitter.com/PillarWallet',
    website: 'https://pillarproject.io/',
    whitepaper: '',
    isDefault: true,
    balance: 0,
  },
];

// keep this list order, unless it changes
export const fiatCurrencies = [
  {
    name: 'EUR',
    symbol: 'EUR',
    decimals: 2,
    iconUrl: 'https://api-core.pillarproject.io/asset/images/fiat/ic_52_EUR.png',
  },
  {
    name: 'GBP',
    symbol: 'GBP',
    decimals: 2,
    iconUrl: 'https://api-core.pillarproject.io/asset/images/fiat/ic_52_GBP.png',
  },
  {
    name: 'USD',
    symbol: 'USD',
    decimals: 2,
    iconUrl: 'https://api-core.pillarproject.io/asset/images/fiat/ic_52_USD.png',
  },
];
