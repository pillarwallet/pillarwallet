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

import { createSelector } from 'reselect';
import { getEnv } from 'configs/envConfig';

import { formatAmount } from 'utils/common';

import type { SyntheticAsset, AssetOption } from 'models/Asset';

import { syntheticAssetsSelector } from './selectors';


export const activeSyntheticAssetsSelector = createSelector(
  syntheticAssetsSelector,
  (syntheticAssets: SyntheticAsset[]): AssetOption[] => {
    if (!syntheticAssets) return [];

    return syntheticAssets
      .filter((asset) => asset.availableBalance >= 0)
      .map((asset) => ({
        ...asset,
        token: asset.symbol,
        imageUrl: asset.iconUrl ? `${getEnv().SDK_PROVIDER}/${asset.iconUrl}?size=3` : '',
        contractAddress: asset.address,
        balance: {
          syntheticBalance: formatAmount(asset.availableBalance),
          token: asset.symbol,
        },
      }));
  },
);
