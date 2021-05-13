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

// Types
import { type Chain, CHAIN } from 'models/Chain';

export type ConnectedAppItem = {|
  title: string,
  iconUrl: string,
  chain: Chain,
|};

export function useConnectedAppItems(): ConnectedAppItem[] {
  return [
    {
      title: 'SushiSwap',
      iconUrl:
        'https://images.prismic.io/pillar-app/3c0d1f5a-58ea-402b-b001-04dcc508bafb_pticon.jpg?auto=compress,format',
      chain: CHAIN.POLYGON,
    },
    {
      title: '1inch',
      iconUrl:
        'https://images.prismic.io/pillar-app/3c0d1f5a-58ea-402b-b001-04dcc508bafb_pticon.jpg?auto=compress,format',
      chain: CHAIN.XDAI,
    },
    {
      title: 'Rarible',
      iconUrl:
        'https://images.prismic.io/pillar-app/3c0d1f5a-58ea-402b-b001-04dcc508bafb_pticon.jpg?auto=compress,format',
      chain: CHAIN.ETHEREUM,
    },
    {
      title: 'DYDX',
      iconUrl:
        'https://images.prismic.io/pillar-app/3c0d1f5a-58ea-402b-b001-04dcc508bafb_pticon.jpg?auto=compress,format',
      chain: CHAIN.BINANCE,
    },
  ];
}
