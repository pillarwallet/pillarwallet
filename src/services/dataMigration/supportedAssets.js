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

// Constants
import { CHAIN } from 'constants/chainConstants';

// Types
import type { Asset } from 'models/Asset';
import type { Chain, ChainRecord } from 'models/Chain';

export default function (storageData: Object) {
  let supportedAssets = storageData?.supportedAssets?.supportedAssets || {};

  // Version 1: migrate to multi-chain assets
  if (Array.isArray(supportedAssets)) {
    supportedAssets = ({ ethereum: supportedAssets }: ChainRecord<Asset[]>);
  }

  // Version 2: add chain field
  addChainFieldIfNeeded(supportedAssets, CHAIN.ETHEREUM);
  addChainFieldIfNeeded(supportedAssets, CHAIN.POLYGON);
  addChainFieldIfNeeded(supportedAssets, CHAIN.BINANCE);
  addChainFieldIfNeeded(supportedAssets, CHAIN.XDAI);
  addChainFieldIfNeeded(supportedAssets, CHAIN.OPTIMISM);
  addChainFieldIfNeeded(supportedAssets, CHAIN.ARBITRUM);

  return supportedAssets;
}

export function addChainFieldIfNeeded(supportedAssets: ChainRecord<Asset[]>, chain: Chain) {
  const chainAssets = supportedAssets[chain];

  // Empty array - do nothing
  if (!chainAssets?.length) return;

  // Already set - do nothing
  if (chainAssets[0].chain) return;

  supportedAssets[chain] = chainAssets.map((asset) => ({ ...asset, chain }));
}
