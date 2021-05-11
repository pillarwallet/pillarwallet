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

import { useTranslation, useTranslationWithPrefix } from 'translations/translate';

// Utils
import { useThemeColors } from 'utils/themes';

// Types
import type { IconName } from 'components/modern/Icon';
import { type AssetCategory, ASSET_CATEGORY } from 'models/AssetCategory';
import { type Chain, CHAIN } from 'models/Chain';


type ChainConfig = {|
  title: string,
  titleShort: string,
  iconName: IconName,
  color: string,
|};

/**
 * Returns common UI aspects (texts, icons, color) for displaying main Ethereum chain and side chains.
 */
export function useChainsConfig(): { [key: Chain]: ChainConfig} {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return {
    [CHAIN.POLYGON]: {
      title: t('chains.polygon'),
      titleShort: t('chainsShort.polygon'),
      iconName: 'polygon',
      color: colors.polygon,
    },
    [CHAIN.BINANCE]: {
      title: t('chains.binance'),
      titleShort: t('chainsShort.binance'),
      iconName: 'binance',
      color: colors.binance,
    },
    [CHAIN.XDAI]: {
      title: t('chains.xdai'),
      titleShort: t('chainsShort.xdai'),
      iconName: 'xdai',
      color: colors.xdai,
    },
    [CHAIN.ETHEREUM]: {
      title: t('chains.ethereum'),
      titleShort: t('chainsShort.ethereum'),
      iconName: 'ethereum',
      color: colors.ethereum,
    },
  };
}

type AssetCategoryConfig = {|
  title: string,
  iconName: IconName,
  chartColor: string,
|};

/**
 * Returns common UI aspects (texts, icons, color) for displaying asset categories.
 */
export function useAssetCategoriesConfig(): { [key: AssetCategory]: AssetCategoryConfig } {
  const { t } = useTranslationWithPrefix('assetCategories');

  return {
    [ASSET_CATEGORY.WALLET]: {
      title: t('wallet'),
      iconName: 'wallet',
      chartColor: '#e91e63',
    },
    [ASSET_CATEGORY.DEPOSITS]: {
      title: t('deposits'),
      iconName: 'deposit',
      chartColor: '#9c27b0',
    },
    [ASSET_CATEGORY.INVESTMENTS]: {
      title: t('investments'),
      iconName: 'investment',
      chartColor: '#5727b0',
    },
    [ASSET_CATEGORY.LIQUIDITY_POOLS]: {
      title: t('liquidityPools'),
      iconName: 'liquidity-pool',
      chartColor: '#276bb0',
    },
    [ASSET_CATEGORY.COLLECTIBLES]: {
      title: t('collectibles'),
      iconName: 'collectible',
      chartColor: '#e91e63',
    },
    [ASSET_CATEGORY.REWARDS]: {
      title: t('rewards'),
      iconName: 'reward',
      chartColor: '#57acdc',
    },
  };
}
