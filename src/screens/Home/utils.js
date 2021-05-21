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

import { mapValues } from 'lodash';

// Selectors
import { useRootSelector } from 'selectors';
import { activeAccountTotalBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Utils
import { getTotalBalance } from 'utils/balances';
import { sum } from 'utils/bigNumber';

// Types
import type { CategoryBalances, ChainBalances, CategoryBalancesPerChain, CollectibleCountPerChain } from 'models/Home';

export function useCategoryBalancesPerChain(): CategoryBalancesPerChain {
  return useRootSelector(activeAccountTotalBalancesSelector);
}

export function useCollectibleCountPerChain(): CollectibleCountPerChain {
  const ethereum = useRootSelector(accountCollectiblesSelector).length;
  return { ethereum };
}

export function getTotalCategoryBalances(chains: CategoryBalancesPerChain): CategoryBalances {
  const chainBalances = Object.keys(chains ?? {}).map((key) => chains[key]);

  return {
    wallet: sum(chainBalances.map((chain) => chain?.wallet)),
    deposits: sum(chainBalances.map((chain) => chain?.deposits)),
    investments: sum(chainBalances.map((chain) => chain?.investments)),
    liquidityPools: sum(chainBalances.map((chain) => chain?.liquidityPools)),
    rewards: sum(chainBalances.map((chain) => chain?.rewards)),
  };
}

export function getTotalChainBalances(chains: CategoryBalancesPerChain): ChainBalances {
  return mapValues(chains, (balances) => getTotalBalance(balances));
}

export function getTotalCollectibleCount(collectibleCountPerChain: CollectibleCountPerChain): number {
  const counts = Object.keys(collectibleCountPerChain).map((chain) => collectibleCountPerChain[chain]);
  return counts.reduce((total, count) => count != null ? total + count : total, 0);
}
