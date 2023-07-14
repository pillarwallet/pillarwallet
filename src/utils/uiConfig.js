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

import { useTranslation } from 'translations/translate';

// Constants
import { ETH, MATIC, BNB, XDAI, ASSET_CATEGORY } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// Utils
import { useThemeColors } from 'utils/themes';
import { isProdEnv } from 'utils/environment';

// Types
import type { IconName } from 'components/core/Icon';
import type { AssetCategory } from 'models/AssetCategory';
import type { Chain } from 'models/Chain';

type ChainConfig = {|
  title: string,
  titleShort: string,
  iconName: IconName,
  color: string,
  gasSymbol: string,
  iconUrl: string,
|};

/**
 * Returns common UI aspects (texts, icons, color) for displaying main Ethereum chain and side chains.
 */
export function useChainsConfig(): { [key: Chain]: ChainConfig } {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return {
    [CHAIN.POLYGON]: {
      title: isProdEnv() ? t('chains.polygon') : t('chains.mumbai'),
      titleShort: t('chainsShort.polygon'),
      iconName: 'polygon',
      color: colors.polygon,
      gasSymbol: MATIC,
      iconUrl: 'https://tokens.1inch.exchange/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
    },
    [CHAIN.BINANCE]: {
      title: isProdEnv() ? t('chains.binance') : t('chains.binance_test'),
      titleShort: t('chainsShort.binance'),
      iconName: 'binance',
      color: colors.binance,
      gasSymbol: BNB,
      iconUrl:
        'https://images.prismic.io/pillar-app/d8e73973-82f1-4b20-a068-fe20e21816b0_0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c_1.png?auto=compress,format',
    },
    [CHAIN.XDAI]: {
      title: isProdEnv() ? t('chains.xdai') : t('chains.sokol'),
      titleShort: t('chainsShort.xdai'),
      iconName: 'xdai',
      color: colors.xdai,
      gasSymbol: XDAI,
      iconUrl: 'https://tokens.1inch.exchange/0x6810e776880c02933d47db1b9fc05908e5386b96.png',
    },
    [CHAIN.ETHEREUM]: {
      title: isProdEnv() ? t('chains.ethereum') : t('chains.gorli'),
      titleShort: t('chainsShort.ethereum'),
      iconName: 'ethereum',
      color: colors.ethereum,
      gasSymbol: ETH,
      iconUrl: 'https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    },
    [CHAIN.OPTIMISM]: {
      title: isProdEnv() ? t('chains.optimism') : t('chains.optimism_gorli'),
      titleShort: t('chainsShort.optimism'),
      iconName: 'optimism',
      color: colors.optimism,
      gasSymbol: ETH,
      iconUrl: 'https://tokens.1inch.io/0x4200000000000000000000000000000000000042.png',
    },
    [CHAIN.ARBITRUM]: {
      title: isProdEnv() ? t('chains.arbitrum') : t('chains.arbitrum_nitro'),
      titleShort: t('chainsShort.arbitrum'),
      iconName: 'arbitrum',
      color: colors.arbitrum,
      gasSymbol: ETH,
      iconUrl: 'https://arbitrum.io/wp-content/uploads/2022/12/One-Logo-280x280-1-150x150.png',
    },
  };
}

export function useChainConfig(chain: Chain): ChainConfig {
  const configs = useChainsConfig();
  return configs[chain];
}

type AssetCategoryConfig = {|
  title: string,
  titleShort: string,
  iconName: IconName,
  chartColor: string,
|};

/**
 * Returns common UI aspects (texts, icons, color) for displaying asset categories.
 */
export function useAssetCategoriesConfig(): { [key: AssetCategory]: AssetCategoryConfig } {
  const { t } = useTranslation();

  return {
    [ASSET_CATEGORY.WALLET]: {
      title: t('assetCategories.wallet'),
      titleShort: t('assetCategoriesShort.wallet'),
      iconName: 'wallet',
      chartColor: '#e91e63',
    },
    [ASSET_CATEGORY.DEPOSITS]: {
      title: t('assetCategories.deposits'),
      titleShort: t('assetCategoriesShort.deposits'),
      iconName: 'deposit',
      chartColor: '#9c27b0',
    },
    [ASSET_CATEGORY.INVESTMENTS]: {
      title: t('assetCategories.investments'),
      titleShort: t('assetCategoriesShort.investments'),
      iconName: 'investment',
      chartColor: '#5727b0',
    },
    [ASSET_CATEGORY.LIQUIDITY_POOLS]: {
      title: t('assetCategories.liquidityPools'),
      titleShort: t('assetCategoriesShort.liquidityPools'),
      iconName: 'liquidity-pool',
      chartColor: '#276bb0',
    },
    [ASSET_CATEGORY.COLLECTIBLES]: {
      title: t('assetCategories.collectibles'),
      titleShort: t('assetCategoriesShort.collectibles'),
      iconName: 'collectible',
      chartColor: '#e91e63',
    },
    [ASSET_CATEGORY.APPS]: {
      title: t('home.apps.title'),
      titleShort: t('home.apps.title'),
      iconName: 'investment',
      chartColor: '#5727b0',
    },
    [ASSET_CATEGORY.REWARDS]: {
      title: t('assetCategories.rewards'),
      titleShort: t('assetCategoriesShort.rewards'),
      iconName: 'reward',
      chartColor: '#57acdc',
    },
  };
}
