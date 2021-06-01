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

import * as React from 'react';
import { LayoutAnimation } from 'react-native';

// Configs
import { getEnv } from 'configs/envConfig';

// Utils
import { LIST_ITEMS_APPEARANCE } from 'utils/layoutAnimations';

// Types
import type { Asset } from 'models/Asset';
import type { Chain } from 'models/Chain';

/**
 * Extracted from AssetList.js. Asset screen expects specific but untyped format of data as navigation param.
 */
export function buildAssetDataNavigationParam(asset: Asset) {
  const { symbol, name, iconUrl, decimals, iconMonoUrl, patternUrl } = asset;

  const fullIconMonoUrl = iconMonoUrl ? `${getEnv().SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
  const fullIconUrl = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';
  const patternIcon = patternUrl ? `${getEnv().SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl;

  return {
    id: symbol,
    name: name || symbol,
    token: symbol,
    contractAddress: asset.address,
    icon: fullIconMonoUrl,
    iconColor: fullIconUrl,
    imageUrl: fullIconUrl,
    patternIcon,
    decimals,
  };
}

export type FlagPerChain = { [Chain]: ?boolean };

export function useExpandItemsPerChain(initialChain: ?Chain) {
  const [expandItemsPerChain, setExpandItemsPerChain] = React.useState<FlagPerChain>(
    // $FlowFixMe: type inference limitation
    initialChain ? { [initialChain]: true } : {},
  );

  const toggleExpandItems = (chain: Chain) => {
    LayoutAnimation.configureNext(LIST_ITEMS_APPEARANCE);
    // $FlowFixMe: type inference limitation
    setExpandItemsPerChain({ ...expandItemsPerChain, [chain]: !expandItemsPerChain[chain] });
  };

  return { expandItemsPerChain, toggleExpandItems };
}
