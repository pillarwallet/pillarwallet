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
    description: `Ethereum is a decentralized platform that runs smart contracts: applications that run exactly
    as programmed without any possibility of downtime, censorship, fraud or third-party interference.`,
    name: 'Ethereum',
    symbol: 'ETH',
    wallpaperUrl: 'asset/images/tokens/wallpaper/ethBg.png',
    iconUrl: 'asset/images/tokens/icons/ethColor.png',
    iconMonoUrl: 'asset/images/tokens/icons/eth.png',
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
    description: `We are building the world's best cryptocurrency and token wallet that will become the dashboard
    for your digital life.`,
    name: 'Pillar',
    symbol: 'PLR',
    wallpaperUrl: 'asset/images/tokens/wallpaper/plrBg.png',
    iconUrl: 'asset/images/tokens/icons/plrColor.png',
    iconMonoUrl: 'asset/images/tokens/icons/plr.png',
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
    iconUrl: 'asset/images/fiat/ic_52_EUR.png',
    iconMonoUrl: 'asset/images/fiat/ic_52_EUR.png',
  },
  {
    name: 'GBP',
    symbol: 'GBP',
    decimals: 2,
    iconUrl: 'asset/images/fiat/ic_52_GBP.png',
    iconMonoUrl: 'asset/images/fiat/ic_52_GBP.png',
  },
  {
    name: 'USD',
    symbol: 'USD',
    decimals: 2,
    iconUrl: 'asset/images/fiat/ic_52_USD.png',
    iconMonoUrl: 'asset/images/fiat/ic_52_USD.png',
  },
];
