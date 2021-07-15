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

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useChainSupportedAssets } from 'selectors';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';
import { collectiblesPerAccountSelector } from 'selectors/collectibles';

// Utils
import { mapNotNil } from 'utils/array';
import { findAssetByAddress } from 'utils/assets';
import { recordValues } from 'utils/object';

// Types
import type { Asset } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

export type TokenItem = {|
  asset: Asset,
  balance: BigNumber,
|};

export const useTokenItems = (accountId: string): TokenItem[] => {
  const balancesPerAccount = useRootSelector(assetsBalancesPerAccountSelector);
  const supportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);

  return useMemo(() => {
    const balanceValues = recordValues(balancesPerAccount[accountId]?.ethereum?.wallet);

    return mapNotNil(balanceValues, (balanceValue) => {
      const asset = findAssetByAddress(supportedAssets, balanceValue.address);
      if (!asset) return null;

      const balance = BigNumber(balanceValue.balance);
      return { asset, balance };
    });
  }, [accountId, balancesPerAccount, supportedAssets]);
};

export const useCollectibles = (accountId: string): Collectible[] => {
  const collectiblesPerAccount = useRootSelector(collectiblesPerAccountSelector);
  return collectiblesPerAccount[accountId]?.ethereum ?? [];
};
