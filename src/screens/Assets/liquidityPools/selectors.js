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

import type { BigNumber } from 'bignumber.js';

// Selectors
import { useRootSelector } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { accountLiquidityPoolsBalancePerChainSelector } from 'selectors/totalBalances';

// Utils
import { getChainLiquidityPoolAssetsBalances } from 'utils/balances';
import { sumRecord } from 'utils/bigNumber';

// Types
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';
import type { ServiceAssetBalance } from 'models/Balances';

export function useLiquidityPoolsTotalBalance(): FiatBalance {
  const value = sumRecord(useLiquidityPoolsBalancePerChain());
  return { value };
}

export function useLiquidityPoolsBalancePerChain(): ChainRecord<BigNumber> {
  return useRootSelector(accountLiquidityPoolsBalancePerChainSelector);
}

export function useLiquidityPoolAssets(): ChainRecord<ServiceAssetBalance[]> {
  return getChainLiquidityPoolAssetsBalances(useRootSelector(accountAssetsBalancesSelector));
}
