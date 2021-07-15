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
import { accountRewardsBalancePerChainSelector } from 'selectors/totalBalances';

// Utils
import { sumRecord } from 'utils/bigNumber';

// Types
import type { Chain, ChainRecord } from 'models/Chain';

export function useRewardsTotalBalance(): BigNumber {
  return sumRecord(useRewardsBalancePerChain());
}

export function useRewardsBalancePerChain(): ChainRecord<BigNumber> {
  return useRootSelector(accountRewardsBalancePerChainSelector);
}

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
export type RewardItem = {|
  key: string,
  service: string,
  title: string,
  iconUrl?: string,
  value: BigNumber,
  assetSymbol: string,
  assetAddress: string,
  chain: Chain,
|};

export function useRewardsAssets(): ChainRecord<RewardItem[]> {
  // TODO: replace once available from Etherspot SDK
  const rewards = [];

  return { ethereum: rewards };
}
