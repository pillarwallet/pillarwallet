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
import { liquidityPoolsBalanceSelector } from 'selectors/balances';

// Types
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';

export function useLiquidityPoolsBalance(): FiatBalance {
  const value = useRootSelector(liquidityPoolsBalanceSelector);
  return { value };
}

export function useLiquidityPoolsChainBalances(): ChainRecord<BigNumber> {
  return { polygon: BigNumber(761.5), xdai: BigNumber(120.2) };
}
export type LiquidityPoolItem = {|
  key: string,
  service: string,
  title: string,
  iconUrl: string,
  value: BigNumber,
  change?: BigNumber,
|};

// TODO: provide real assets data
export function useLiquidityPoolAssets(): ChainRecord<LiquidityPoolItem[]> {
  /* eslint-disable i18next/no-literal-string */
  const ethereum = [
    {
      key: 'uniswap-1',
      title: 'Uniswap v2 ETH/PLR',
      service: 'Uniswap v2',
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/ethplruniColor.png?size=3',
      value: BigNumber(480.2),
      change: BigNumber(3.32),
    },
    {
      key: 'uniswap-2',
      title: 'Uniswap v2 DAI/PLR',
      service: 'Uniswap v2',
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/daiplrColor.png?size=3',
      value: BigNumber(281.3),
      change: BigNumber(2.12),
    },
    {
      key: 'balancer-1',
      title: 'Balancer Dough',
      service: 'Balancer',
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/balColor.png?size=3',
      value: BigNumber(120.2),
      change: BigNumber(12.3),
    },
  ];

  return { ethereum };
}
