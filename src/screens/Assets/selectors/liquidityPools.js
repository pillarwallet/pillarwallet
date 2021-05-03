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
import { useTranslation } from 'translations/translate';

// Constants
import { LIQUIDITY_POOLS } from 'constants/navigationConstants';

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
export type LiquidityPoolItem = {|
  key: string,
  service: string,
  title: string,
  iconUrl: string,
  value: BigNumber,
  change?: BigNumber,
  poolShare?: BigNumber,
|};

// TODO: provide real assets data
export function useLiquidityPoolAssets(): ChainRecord<LiquidityPoolItem[]> {
  const ethereum = [
    {
      key: 'uniswap-1',
      title: 'Uniswap v2 ETH/PLN',
      service: 'Uniswap v2',
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/ethplruniColor.png?size=3',
      value: BigNumber(480.2),
      change: BigNumber(3.32),
      poolShare: BigNumber(0.326),
    },
    {
      key: 'balancer-1',
      title: 'Balancer Dough',
      service: 'Balancer',
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/balColor.png?size=3',
      value: BigNumber(120.2),
      change: BigNumber(12.3),
      poolShare: BigNumber(0.0224),
    },
  ];

  return { ethereum };
}

export type LiquidityPoolApp = {|
  title: string,
  subtitle?: string,
  iconUrl: string,
  navigationPath: string,
|};

export function useLiquidityPoolApps(): LiquidityPoolApp[] {
  const { t } = useTranslation();

  return [
    {
      title: t('apps.uniswap'),
      iconUrl: 'https://api-core.pillarproject.io/asset/images/tokens/icons/uniColor.png?size=3',
      navigationPath: LIQUIDITY_POOLS,
    },
  ];
}
