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
import type { ImageSource } from 'utils/types/react-native';
import type { Chain, AssetCategory } from 'models/Asset';
import type { IconName } from 'components/modern/Icon';

const mainnetIcon = require('assets/icons/icon-24-network-mainnet.png');
const binanceIcon = require('assets/icons/icon-24-network-binance.png');
const xdaiIcon = require('assets/icons/icon-24-network-xdai.png');


type ChainsConfig = {
  [key: Chain]: {|
    title: string,
    iconSource: ImageSource,
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
      iconSource: mainnetIcon,
      color: colors.ethereum,
    },
    [CHAINS.BINANCE]: {
      title: t('binance'),
      iconSource: binanceIcon,
      color: colors.binance,
    },
    [CHAINS.XDAI]: {
      title: t('xdai'),
      iconSource: xdaiIcon,
      color: colors.xdai,
    },
  };
}

type AssetCategoriesConfig = {
  [key: AssetCategory]: {|
    title: string,
    iconName: IconName,
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
    },
    [ASSET_CATEGORIES.DEPOSITS]: {
      title: t('deposits'),
      iconName: 'deposit',
    },
    [ASSET_CATEGORIES.INVESTMENTS]: {
      title: t('investments'),
      iconName: 'investment',
    },
    [ASSET_CATEGORIES.LIQUIDITY_POOLS]: {
      title: t('liquidityPools'),
      iconName: 'liquidity-pool',
    },
    [ASSET_CATEGORIES.COLLECTIBLES]: {
      title: t('collectibles'),
      iconName: 'collectible',
    },
    [ASSET_CATEGORIES.REWARDS]: {
      title: t('rewards'),
      iconName: 'wallet',
    },
    [ASSET_CATEGORIES.DATASETS]: {
      title: t('datasets'),
      iconName: 'wallet',
    },
  };
}
