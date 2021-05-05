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
import { investmentsBalanceSelector } from 'selectors/balances';

// Types
import type { ImageSource } from 'utils/types/react-native';
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';

const poolTogetherIcon = require('assets/images/apps/pool_together.png');

export function useInvestmentsBalance(): FiatBalance {
  const value = useRootSelector(investmentsBalanceSelector);
  return { value };
}
export type InvestmentItem = {|
  key: string,
  service: string,
  title: string,
  iconSource: ImageSource,
  value: BigNumber,
  change?: BigNumber,
  currentApy?: BigNumber,
|};

// TODO: provide real assets data
export function useInvestmentAssets(): ChainRecord<InvestmentItem[]> {
  const ethereum = [
    {
      key: 'rari-1',
      title: 'Stable pool',
      service: 'Pool Together',
      iconSource: poolTogetherIcon,
      value: BigNumber(10),
      change: BigNumber(1.2),
      currentApy: BigNumber(0.012),
    },
  ];

  return { ethereum };
}
