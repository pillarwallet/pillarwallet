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

import { CHAIN } from 'models/Chain';
import type { WalletConnectCategory } from 'models/WalletConnect';

// TODO: mock data, replace with real data when available
export function useWalletConnectCategories(): WalletConnectCategory[] {
  return [
    {
      id: 'cat-1',
      title: 'Exchanges',
      apps: [
        {
          id: 'app-1',
          title: 'SushiSwap',
          iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
          chains: [CHAIN.POLYGON, CHAIN.ETHEREUM],
        },
        {
          id: 'app-2',
          title: 'Uniswap v3',
          iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
          chains: [CHAIN.XDAI, CHAIN.ETHEREUM],
        },
        {
          id: 'app-3',
          title: 'Uniswap v4',
          iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
          chains: [CHAIN.BINANCE],
        },
      ],
    },
  ];
}
