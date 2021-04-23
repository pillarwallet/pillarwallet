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

import { useTranslationWithPrefix } from 'translations/translate';

// Contants
import { CHAINS, ASSET_CATEGORIES } from 'constants/assetsConstants';

// Utils
import { useThemeColors } from 'utils/themes';

// Types
import type { Chain, AssetCategory } from 'models/Asset';
import type { IconName } from 'components/modern/Icon';

type ChainsConfig = {
  [key: Chain]: {|
    title: string,
    iconName: IconName,
    color: string,
  |},
};

/**
 * Returns common UI aspects (texts, icons, color) for displaying main Ethereum chain and side chains.
 */
export function useChainsConfig(): ChainsConfig {
  const { t } = useTranslationWithPrefix('chains');
  const colors = useThemeColors();

  return {
    [CHAINS.ETHEREUM]: {
      title: t('ethereum'),
      iconName: 'ethereum',
      color: colors.ethereum,
    },
    [CHAINS.BINANCE]: {
      title: t('binance'),
      iconName: 'binance',
      color: colors.binance,
    },
    [CHAINS.XDAI]: {
      title: t('xdai'),
      iconName: 'xdai',
      color: colors.xdai,
    },
    [CHAINS.POLYGON]: {
      title: t('polygon'),
      iconName: 'polygon',
      color: colors.polygon,
    },
  };
}

type AssetCategoriesConfig = {
  [key: AssetCategory]: {|
    title: string,
    iconName: IconName,
    chartColor: string,
  |},
};

/**
 * Returns common UI aspects (texts, icons, color) for displaying asset categories.
 */
export function useAssetCategoriesConfig(): AssetCategoriesConfig {
  const { t } = useTranslationWithPrefix('assetCategories');

  return {
    [ASSET_CATEGORIES.WALLET]: {
      title: t('wallet'),
      iconName: 'wallet',
      chartColor: '#e91e63',
    },
    [ASSET_CATEGORIES.DEPOSITS]: {
      title: t('deposits'),
      iconName: 'deposit',
      chartColor: '#9c27b0',
    },
    [ASSET_CATEGORIES.INVESTMENTS]: {
      title: t('investments'),
      iconName: 'investment',
      chartColor: '#5727b0',
    },
    [ASSET_CATEGORIES.LIQUIDITY_POOLS]: {
      title: t('liquidityPools'),
      iconName: 'liquidity-pool',
      chartColor: '#276bb0',
    },
    [ASSET_CATEGORIES.COLLECTIBLES]: {
      title: t('collectibles'),
      iconName: 'collectible',
      chartColor: '#e91e63',
    },
    [ASSET_CATEGORIES.REWARDS]: {
      title: t('rewards'),
      iconName: 'reward',
      chartColor: '#57acdc',
    },
    [ASSET_CATEGORIES.DATASETS]: {
      title: t('datasets'),
      iconName: 'dataset',
      chartColor: '#57dcbe',
    },
  };
}
