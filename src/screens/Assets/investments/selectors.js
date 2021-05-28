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
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { accountInvestmentsTotalBalancesSelector } from 'selectors/totalBalances';

// Utils
import { getChainInvestmentAssetsBalances } from 'utils/balances';
import { sumRecord } from 'utils/bigNumber';

// Types
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';
import type { InvestmentAssetBalance } from 'models/Balances';

export function useInvestmentsBalance(): FiatBalance {
  const value = sumRecord(useInvestmentsChainBalances());
  return { value };
}

export function useInvestmentsChainBalances(): ChainRecord<BigNumber> {
  return useRootSelector(accountInvestmentsTotalBalancesSelector);
}

export function useInvestmentAssets(): ChainRecord<InvestmentAssetBalance[]> {
  return getChainInvestmentAssetsBalances(useRootSelector(accountAssetsBalancesSelector));
}
