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

// Utils
import { sumBy, sumRecord } from 'utils/bigNumber';
import { recordValues } from 'utils/object';

// Types
import type { ChainRecord } from 'models/Chain';
import type { AccountTotalBalances, CategoryRecord } from 'models/TotalBalances';

export function calculateTotalBalance(accountBalances: AccountTotalBalances): BigNumber {
  const totalBalancePerCategory = calculateTotalBalancePerCategory(accountBalances);
  return sumRecord(totalBalancePerCategory);
}

export function calculateTotalBalancePerCategory(accountBalances: AccountTotalBalances): CategoryRecord<BigNumber> {
  return {
    wallet: sumRecord(accountBalances.wallet),
    deposits: sumRecord(accountBalances.deposits),
    investments: sumRecord(accountBalances.investments),
    liquidityPools: sumRecord(accountBalances.liquidityPools),
    rewards: sumRecord(accountBalances.rewards),
  };
}

export function calculateTotalBalancePerChain(accountBalances: AccountTotalBalances): ChainRecord<BigNumber> {
  const balancesPerChain = recordValues(accountBalances);
  return {
    ethereum: sumBy(balancesPerChain, (balance) => balance?.ethereum),
    polygon: sumBy(balancesPerChain, (balance) => balance?.polygon),
    binance: sumBy(balancesPerChain, (balance) => balance?.binance),
    xdai: sumBy(balancesPerChain, (balance) => balance?.xdai),
  };
}

