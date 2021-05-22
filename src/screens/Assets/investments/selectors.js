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
import {
  investmentsTotalBalanceByChainsSelector,
  investmentsTotalBalanceSelector,
} from 'selectors/balances';

// Types
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';
import type { TotalBalancesPerChain } from 'models/Balances';

export function useInvestmentsBalance(): FiatBalance {
  const value = useRootSelector(investmentsTotalBalanceSelector);
  return { value };
}

export function useInvestmentsChainBalances(): TotalBalancesPerChain {
  return useRootSelector(investmentsTotalBalanceByChainsSelector);
}

/** Note: items are groupped by service. */
export type InvestmentItem = {|
  key: string,
  service: string,
  title: string,
  iconUrl: ?string,
  value: BigNumber,
  change?: BigNumber,
|};

export function useInvestmentAssets(): ChainRecord<InvestmentItem[]> {
  // TODO: replace once available from Etherspot SDK
  const investments = [];

  return { ethereum: investments };
}
