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

// Selectors
import { useRootSelector } from 'selectors';
import {
  walletBalanceSelector,
  depositsBalanceSelector,
  investmentsBalanceSelector,
  liquidityPoolsBalanceSelector,
} from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Utils
import { BigNumber } from 'utils/common';
import { sum } from 'utils/bigNumber';

// Types
import type { CategoryBalance, CategoryBalancesPerChain, CollectibleCountPerChain } from 'models/Home';

export function useCategoryBalancesPerChain(): CategoryBalancesPerChain {
  const wallet = useRootSelector(walletBalanceSelector);
  const deposits = useRootSelector(depositsBalanceSelector);
  const investments = useRootSelector(investmentsBalanceSelector);
  const liquidityPools = useRootSelector(liquidityPoolsBalanceSelector);
  const rewards = BigNumber(0);
  const datasets = BigNumber(0);

  const ethereum = {
    wallet,
    deposits,
    investments,
    liquidityPools,
    rewards,
    datasets,
  };

  return { ethereum };
}

export function useCollectibleCountPerChain(): CollectibleCountPerChain {
  const ethereum = useRootSelector(accountCollectiblesSelector).length;
  return { ethereum };
}

export function getTotalCategoryBalances(chains: CategoryBalancesPerChain): CategoryBalance {
  const balances = Object.keys(chains).map((key) => chains[key]);
  return {
    wallet: sum(balances.map((chain) => chain?.wallet)),
    deposits: sum(balances.map((chain) => chain?.deposits)),
    investments: sum(balances.map((chain) => chain?.investments)),
    liquidityPools: sum(balances.map((chain) => chain?.liquidityPools)),
    rewards: sum(balances.map((chain) => chain?.rewards)),
    datasets: sum(balances.map((chain) => chain?.datasets)),
  };
}

export function getTotalBalance(categories: CategoryBalance): BigNumber {
  const balances = Object.keys(categories).map((key) => categories[key]);
  return sum(balances);
}

export function getTotalCollectibleCount(collectibleCountPerChain: CollectibleCountPerChain): number {
  const counts = Object.keys(collectibleCountPerChain).map((chain) => collectibleCountPerChain[chain]);
  return counts.reduce((total, count) => count != null ? total + count : total, 0);
}