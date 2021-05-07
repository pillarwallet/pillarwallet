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

import { type Chain, CHAIN } from 'models/Chain';

export type WalletConnectItem = {|
  title: string,
  iconUrl: string,
  category: string,
  chain: Chain,
|};

// TODO: mock data, replace with real data when available
export function useWalletConnectItems(): WalletConnectItem[] {
  /* eslint-disable i18next/no-literal-string */
  return [
    {
      title: 'SushiSwap',
      category: 'Exchanges',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Curve',
      category: 'Exchanges',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Curve 2',
      category: 'Exchanges',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Alpha Homora',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Alpha Homora 1',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Alpha Homora 2',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Alpha Homora 3',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Alpha Homora 4',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Rarible',
      category: 'NFT Marketplace',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
  ];
}
