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
import { accountDepositsBalancePerChainSelector } from 'selectors/totalBalances';

// Utils
import { getChainDepositAssetsBalances } from 'utils/balances';
import { sumRecord } from 'utils/bigNumber';

// Types
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';
import type { ServiceAssetBalance } from 'models/Balances';

export function useDepositsTotalBalance(): FiatBalance {
  const value = sumRecord(useDepositsBalancePerChain());
  return { value };
}

export function useDepositsBalancePerChain(): ChainRecord<BigNumber> {
  return useRootSelector(accountDepositsBalancePerChainSelector);
}

export function useDepositsAssets(): ChainRecord<ServiceAssetBalance[]> {
  return getChainDepositAssetsBalances(useRootSelector(accountAssetsBalancesSelector));
}
