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
import type { ChainRecord } from 'models/Chain';

export type CollectibleItem = {|
  key: string,
  id: string,
  title: string,
  description?: ?string,
  iconUrl: ?string,
|};

// TODO: provide real assets data
export function useCollectibleAssets(): ChainRecord<CollectibleItem[]> {
  /* eslint-disable i18next/no-literal-string */
  const ethereum = [
    {
      key: 'aave-1',
      id: '3212351235123123532535432145432',
      title: 'DAI',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ' +
        'dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
        'ea commodo consequat.',
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/balColor.png?size=3',
    },
    {
      key: 'aave-2',
      id: '3212351235123123532535432145433',
      title: 'DAI',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ' +
        'dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
        'ea commodo consequat.',
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/balColor.png?size=3',
    },
    {
      key: 'aave-3',
      id: '3212351235123123532535432145433',
      title: 'DAI',
      iconUrl:
        'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    },
    {
      key: 'aave-4',
      id: '3212351235123123532535432145434',
      title: 'Andre Cronje G.E.',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ' +
        'dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
        'ea commodo consequat.',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/D2CCF869-1E3D-40D9-A236-EDF14EB9BF02.png',
    },
    {
      key: 'aave-5',
      id: '3212351235123123532535432145435',
      title: 'DAI',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ' +
        'dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
        'ea commodo consequat.',
      iconUrl:
        'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    },
    {
      key: 'aave-6',
      id: '3212351235123123532535432145436',
      title: 'XO.XO.XO Xmas',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ' +
        'dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
        'ea commodo consequat.',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/F45B4F0B-D106-4063-9ED5-71E88AA8C81A.png',
    },
    {
      key: 'aave-7',
      id: '3212351235123123532535432145437',
      title: 'Legend of Defi',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ' +
        'dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
        'ea commodo consequat.',
      iconUrl: 'https://cdn.zeplin.io/5fa95ca539e6804a10dec0a4/assets/FC5F1ABA-2E26-47E2-9C95-B3A205CD1215.png',
    },
  ];
  return { ethereum };
}
