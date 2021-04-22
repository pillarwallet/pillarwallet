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

/* eslint-disable object-curly-newline */

import { Platform } from 'react-native';

// Configs
import { getEnv } from 'configs/envConfig';

// Types
import type { Asset } from 'models/Asset';

type AssetDetailsContext = {|
  accountAddress: ?string,
|};

/**
 * Extracted from AssetList.js. Asset screen expects specific but untyped format of data as navigation param.
 */
export function buildAssetDataNavigationParam(
  asset: Asset,
  { accountAddress }: AssetDetailsContext,
) {
  const { symbol, name, iconUrl, decimals, iconMonoUrl, patternUrl, wallpaperUrl } = asset;

  const fullIconMonoUrl = iconMonoUrl ? `${getEnv().SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
  const fullIconWallpaperUrl = `${getEnv().SDK_PROVIDER}/${wallpaperUrl}${Platform.OS === 'ios' ? '?size=3' : ''}`;
  const fullIconUrl = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';
  const patternIcon = patternUrl ? `${getEnv().SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl;

  return {
    id: symbol,
    name: name || symbol,
    token: symbol,
    address: accountAddress,
    contractAddress: asset.address,
    icon: fullIconMonoUrl,
    wallpaper: fullIconWallpaperUrl,
    iconColor: fullIconUrl,
    patternIcon,
    description: asset.description,
    decimals,
  };
}
