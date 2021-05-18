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

import { BigNumber } from 'bignumber.js';

// Selectors
import { useRootSelector } from 'selectors';
import { rewardsBalanceSelector } from 'selectors/balances';

// Utils
import { getImageUrl } from 'utils/images';

// Types
import type { ChainRecord } from 'models/Chain';

export function useRewardsBalance(): BigNumber {
  return useRootSelector(rewardsBalanceSelector);
}

export function useRewardsChainBalances(): ChainRecord<BigNumber> {
  return { polygon: BigNumber(100), xdai: BigNumber(200) };
}

export type RewardItem = {|
  key: string,
  service: string,
  title: string,
  iconUrl?: string,
  value: BigNumber,
  symbol: string,
|};

// TODO: provide real assets data
export function useRewardsAssets(): ChainRecord<RewardItem[]> {
  /* eslint-disable i18next/no-literal-string */
  const polygon = [
    {
      key: 'pillar-1',
      service: 'Uniswap v2 ETH/PLR',
      title: 'Pillar',
      iconUrl: getImageUrl('asset/images/tokens/icons/plrColor.png', 3),
      value: BigNumber(10000),
      symbol: 'PLR',
    },
  ];

  const xdai = [
    {
      key: 'ocean-1',
      service: 'Ocean Market',
      title: 'Ocean Protocol',
      value: BigNumber(67),
      symbol: 'OCEAN',
    },
    {
      key: 'rari-1',
      service: 'Rari Capital',
      title: 'Rari Governance Token',
      value: BigNumber(254),
      symbol: 'RGT',
    },
  ];
  return { polygon, xdai };
}
