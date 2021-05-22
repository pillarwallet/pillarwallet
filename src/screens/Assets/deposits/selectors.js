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
import { depositsTotalBalanceSelector, depositsTotalBalanceByChainsSelector } from 'selectors/balances';

// Types
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';
import type { TotalBalancesPerChain } from 'models/Balances';

export function useDepositsBalance(): FiatBalance {
  const value = useRootSelector(depositsTotalBalanceSelector);
  return { value };
}

export function useDepositsChainBalances(): TotalBalancesPerChain {
  return useRootSelector(depositsTotalBalanceByChainsSelector);
}

export type DepositItem = {|
  key: string,
  service: string,
  title: string,
  iconUrl: ?string,
  value: BigNumber,
  change?: BigNumber,
  currentApy?: BigNumber,
|};


export function useDepositsAssets(): ChainRecord<DepositItem[]> {
  // TODO: replace once available from Etherspot SDK
  const deposits = [];

  return { ethereum: deposits };
}

