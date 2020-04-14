/* eslint-disable quotes */
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

export type AppItem = {
  name: string,
  logo: number,
  text: string,
  url: string,
}

const zerionLogo = require('assets/images/apps/zerion.png');
const poolTogetherLogo = require('assets/images/apps/pool_together.png');
const mooniLogo = require('assets/images/apps/mooni.png');
const oasisLogo = require('assets/images/apps/oasis.png');
const sablierLogo = require('assets/images/apps/sablier.png');
const binanceLogo = require('assets/images/apps/binance_dex.png');
const asyncartLogo = require('assets/images/apps/asyncart.png');
const knownOriginLogo = require('assets/images/apps/known_origin.png');
const cloversLogo = require('assets/images/apps/clovers.png');
const localCryptosLogo = require('assets/images/apps/local_cryptos.png');

export const APPS: AppItem[] = [
  {
    name: 'Zerion',
    logo: zerionLogo,
    text: 'A simple interface to access decentralized finance to invest, earn interest and borrow crypto assets.',
    url: 'zerion.io',
  },
  {
    name: 'Pool Together',
    logo: poolTogetherLogo,
    text: `No-loss, audited savings game. Deposit Dai into the pool to get tickets. \
Each ticket is a chance to win weekly prizes!`,
    url: 'pooltogether.com',
  },
  {
    name: 'Mooni',
    logo: mooniLogo,
    text: 'A simple solution to cash out cryptocurrencies in fiat to a bank account, without KYC.',
    url: 'mooni.tech',
  },
  {
    name: 'Oasis',
    logo: oasisLogo,
    text: 'Trade, borrow, and save using Dai.',
    url: 'oasis.app',
  },
  {
    name: 'Sablier',
    logo: sablierLogo,
    text: '"Stream" money in real-time.',
    url: 'sablier.finance',
  },
  {
    name: 'Binance DEX',
    logo: binanceLogo,
    text: `Decentralized digital asset exchange from creators of one of the world's leading crypto exchanges.`,
    url: 'binance.org',
  },
  {
    name: 'Local Cryptos',
    logo: localCryptosLogo,
    text: `The world's most popular non-custodial peer-to-peer marketplace where people exchange crypto with \
each other. Buy and sell crypto on your own terms, using any payment method.`,
    url: 'localcryptos.com',
  },
  {
    name: 'Async.art',
    logo: asyncartLogo,
    text: 'Collect and experience programmable rare art.',
    url: 'async.art',
  },
  {
    name: 'Known Origin',
    logo: knownOriginLogo,
    text: 'Discover and collect rare digital artwork.',
    url: 'knownorigin.io',
  },
  {
    name: 'Clovers',
    logo: cloversLogo,
    text: 'Discover, collect & trade cryptographic icons.',
    url: 'clovers.network',
  },
];
