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
  translationKey: string,
  url: string,
  disabled?: boolean,
};

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

/* eslint-disable i18next/no-literal-string */
export const APPS: AppItem[] = [
  {
    name: 'Zerion',
    logo: zerionLogo,
    translationKey: 'zerion',
    url: 'zerion.io',
  },
  {
    name: 'Pool Together',
    logo: poolTogetherLogo,
    translationKey: 'poolTogether',
    url: 'pooltogether.com',
  },
  {
    name: 'Mooni',
    logo: mooniLogo,
    translationKey: 'mooni',
    url: 'mooni.tech',
    disabled: true,
  },
  {
    name: 'Oasis',
    logo: oasisLogo,
    translationKey: 'oasis',
    url: 'oasis.app',
  },
  {
    name: 'Sablier',
    logo: sablierLogo,
    translationKey: 'sablier',
    url: 'sablier.finance',
  },
  {
    name: 'Binance DEX',
    logo: binanceLogo,
    translationKey: 'binanceDex',
    url: 'binance.org',
    disabled: true,
  },
  {
    name: 'Local Cryptos',
    logo: localCryptosLogo,
    translationKey: 'localCryptos',
    url: 'localcryptos.com',
    disabled: true,
  },
  {
    name: 'Async.art',
    logo: asyncartLogo,
    translationKey: 'asyncArt',
    url: 'async.art',
  },
  {
    name: 'Known Origin',
    logo: knownOriginLogo,
    translationKey: 'knownOrigin',
    url: 'knownorigin.io',
  },
  {
    name: 'Clovers',
    logo: cloversLogo,
    translationKey: 'clovers',
    url: 'clovers.network',
  },
];
/* eslint-enable i18next/no-literal-string */
