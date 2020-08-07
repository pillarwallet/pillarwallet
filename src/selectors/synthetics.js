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

import type { SyntheticAsset } from 'models/Asset';
import { formatAmount } from 'utils/common';

import { syntheticAssetsSelector } from './selectors';


export const activeSyntheticAssetsSelector = createSelector(
  syntheticAssetsSelector,
  (syntheticAssets: SyntheticAsset[]) => {
    if (!syntheticAssets) return [];
    return syntheticAssets.reduce((availableAssets, asset) => {
      const {
        symbol,
        iconUrl,
        availableBalance,
        address,
      } = asset;
      if (availableBalance < 0) return availableAssets;

      const imageUrl = iconUrl ? `${getEnv('SDK_PROVIDER')}/${iconUrl}?size=3` : '';
      availableAssets.push({
        token: symbol,
        value: symbol,
        imageUrl,
        contractAddress: address,
        balance: {
          syntheticBalance: formatAmount(availableBalance),
          token: symbol,
        },
        ...asset,
      });
      return availableAssets;
    }, []);
  },
);
