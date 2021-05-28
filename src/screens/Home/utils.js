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

import { BigNumber } from 'bignumber.js';
import { mapValues } from 'lodash';

// Selectors
import { useRootSelector } from 'selectors';
import { accountTotalBalancesSelector } from 'selectors/totalBalances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Utils
import { getTotalBalance } from 'utils/balances';

// Types
import type {
  AccountTotalBalances,
  AccountCollectibleCount,
  CategoryTotalBalances,
  CategoryRecord,
} from 'models/TotalBalances';

export function useBalancesPerCategoryPerChain(): AccountTotalBalances {
  return useRootSelector(accountTotalBalancesSelector);
}

export function useTotalBalance(): CategoryRecord<BigNumber> {
  const accountTotalBalances = useAccountTotalBalances();
  return mapValues(accountTotalBalances, categoryTotalBalances => getTotalBalance(categoryTotalBalances));
}

// TODO: support side-chains
export function useAccountCollectibleCount(): AccountCollectibleCount {
  const ethereum = useRootSelector(accountCollectiblesSelector).length;
  return { ethereum };
}

export function calculateCategoryTotalBalances(balances: AccountTotalBalances): CategoryTotalBalances {
  return mapValues(balances, (categoryBalances: CategoryTotalBalances) => getTotalBalance(categoryBalances));
}

export function getTotalChainBalances(chains: CategoryTotalBalancesPerChain): TotalBalancesPerChain {
  return mapValues(chains, (balances) => getTotalBalance(balances));
}

export function getTotalCollectibleCount(collectibleCountPerChain: CollectibleCountPerChain): number {
  const counts = Object.keys(collectibleCountPerChain).map((chain) => collectibleCountPerChain[chain]);
  return counts.reduce((total, count) => count != null ? total + count : total, 0);
}
