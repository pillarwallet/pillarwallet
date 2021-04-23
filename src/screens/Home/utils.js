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
import { useRootSelector, activeAccountAddressSelector } from 'selectors';
import {
  walletBalanceSelector,
  depositsBalanceSelector,
  investmentsBalanceSelector,
  liquidityPoolsBalanceSelector,
} from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { contactsCountSelector } from 'selectors/contacts';

// Utils
import { BigNumber } from 'utils/common';
import { sum, sumOrNull } from 'utils/bigNumber';

// Types
import type {
  ChainSummaries,
  ChainBalances,
  CategoryBalances,
  Balance,
} from 'models/Home';


export function useChainSummaries(): ChainSummaries {
  const ethereum = {
    walletAddress: useRootSelector(activeAccountAddressSelector),
    collectibleCount: useRootSelector(accountCollectiblesSelector).length,
    contactCount: useRootSelector(contactsCountSelector),
  };

  return { ethereum };
}

export function useChainBalances(): ChainBalances {
  const wallet = { balanceInFiat: useRootSelector(walletBalanceSelector) };
  const deposits = { balanceInFiat: useRootSelector(depositsBalanceSelector) };
  const investments = { balanceInFiat: useRootSelector(investmentsBalanceSelector) };
  const liquidityPools = { balanceInFiat: useRootSelector(liquidityPoolsBalanceSelector) };
  const rewards = { balanceInFiat: BigNumber(0) };
  const datasets = { balanceInFiat: BigNumber(0) };

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

export function getChainBalancesTotal(chains: ChainBalances): CategoryBalances {
  const balances = Object.keys(chains).map((key) => chains[key]);
  return {
    wallet: getTotalBalances(balances.map((chain) => chain?.wallet)),
    deposits: getTotalBalances(balances.map((chain) => chain?.deposits)),
    investments: getTotalBalances(balances.map((chain) => chain?.investments)),
    liquidityPools: getTotalBalances(balances.map((chain) => chain?.liquidityPools)),
    rewards: getTotalBalances(balances.map((chain) => chain?.rewards)),
    datasets: getTotalBalances(balances.map((chain) => chain?.datasets)),
  };
}

export function getCategoryBalancesTotal(categories: CategoryBalances): Balance {
  const balances = Object.keys(categories).map((key) => categories[key]);
  return getTotalBalances(balances);
}

export function getTotalBalances(balances: (?Balance)[]): Balance {
  return {
    balanceInFiat: sum(balances.map((b) => b?.balanceInFiat)),
    changeInFiat: sumOrNull(balances.map((b) => b?.changeInFiat)),
  };
}
