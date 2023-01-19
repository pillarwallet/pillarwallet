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

// Local
import { addChainFieldIfNeeded } from './supportedAssets';

export default function (storageData: Object | any) {
  let popularAssets = storageData?.popularAssets?.popularAssets || {};

  // Version 1: migrate to multi-chain assets
  if (Array.isArray(popularAssets)) {
    popularAssets = { ethereum: popularAssets };
  }

  // Version 2: add chain field
  addChainFieldIfNeeded(popularAssets, CHAIN.ETHEREUM);
  addChainFieldIfNeeded(popularAssets, CHAIN.POLYGON);
  addChainFieldIfNeeded(popularAssets, CHAIN.BINANCE);
  addChainFieldIfNeeded(popularAssets, CHAIN.XDAI);
  addChainFieldIfNeeded(popularAssets, CHAIN.OPTIMISM);
  addChainFieldIfNeeded(popularAssets, CHAIN.AVALANCHE);

  return popularAssets;
}
