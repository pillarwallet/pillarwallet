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

export type WalletConnectItem = {|
  title: string,
  iconUrl: string,
  category: string,
|};

// TODO: mock data, replace with real data when available
export function useWalletConnectItems(): WalletConnectItem[] {
  /* eslint-disable i18next/no-literal-string */
  return [
    {
      title: 'SushiSwap',
      category: 'Exchanges',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/46C8ACE3-730D-4BA2-94A5-16DD2CB06977.svg',
    },
    {
      title: 'Curve',
      category: 'Exchanges',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'SushiSwap 2',
      category: 'Exchanges',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/46C8ACE3-730D-4BA2-94A5-16DD2CB06977.svg',
    },
    {
      title: 'Curve 2',
      category: 'Exchanges',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/9164EB88-994B-44C4-938F-9EA61023779B.png',
    },
    {
      title: 'Alpha Homora',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/AD5CD965-3663-4AF9-8D50-6F00D3B0348F.svg',
    },
    {
      title: 'Alpha Homora 1',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/AD5CD965-3663-4AF9-8D50-6F00D3B0348F.svg',
    },
    {
      title: 'Alpha Homora 2',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/AD5CD965-3663-4AF9-8D50-6F00D3B0348F.svg',
    },
    {
      title: 'Alpha Homora 3',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/AD5CD965-3663-4AF9-8D50-6F00D3B0348F.svg',
    },
    {
      title: 'Alpha Homora 4',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/AD5CD965-3663-4AF9-8D50-6F00D3B0348F.svg',
    },
    {
      title: 'Alpha Homora 5',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/AD5CD965-3663-4AF9-8D50-6F00D3B0348F.svg',
    },
    {
      title: 'Alpha Homora 6',
      category: 'Asset Management',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/AD5CD965-3663-4AF9-8D50-6F00D3B0348F.svg',
    },
    {
      title: 'Rarible',
      category: 'NFT Marketplace',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/6B975E18-9486-4F6E-8EF0-778F4409E1EE.svg',
    },
  ];
}
