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

import * as React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { CHAINS } from 'constants/assetsConstants';
import { ASSETS, SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { formatValue, formatFiatValue } from 'utils/format';
import { useChainsConfig, useAssetCategoriesConfig } from 'utils/uiConfig';

// Types
import type { ChainSummaries, ChainCategoryBalances, CategoryBalances, ChainCollectibleCount } from 'models/Home';
import type { Chain, AssetCategory } from 'models/Asset';

// Local
import CategoryListItem from './components/CategoryListItem';
import { getTotalCollectibleCount } from './utils';

type Props = {|
  chainSummaries: ChainSummaries,
  categoryBalances: CategoryBalances,
  chainCategoryBalances: ChainCategoryBalances,
  chainCollectibleCount: ChainCollectibleCount,
|};

function AssetsSection({ chainSummaries, categoryBalances, chainCategoryBalances, chainCollectibleCount }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('home.assets');
  const navigation = useNavigation();

  const fiatCurrency = useFiatCurrency();

  const chainsConfig = useChainsConfig();
  const categoriesConfig = useAssetCategoriesConfig();

  const totalCollectibleCount = getTotalCollectibleCount(chainCollectibleCount);

  const renderCategory = (category: $Keys<CategoryBalances>) => {
    const balance = categoryBalances[category];
    const formattedBalance = formatFiatValue(balance ?? BigNumber(0), fiatCurrency);

    const { title, iconName } = categoriesConfig[category];

    return (
      <CategoryListItem
        key={`${category}`}
        title={title}
        iconName={iconName}
        onPress={() => navigation.navigate(ASSETS, { category })}
        value={formattedBalance}
      />
    );
  };

  return (
    <Container>
      {!!categoryBalances && Object.keys(categoryBalances).map((category) => renderCategory(category))}

      {totalCollectibleCount != null && (
        <CategoryListItem
          key="collectibles"
          title={tRoot('assetCategories.collectibles')}
          iconName="collectible"
          onPress={() => navigation.navigate(ASSETS)}
          value={formatValue(totalCollectibleCount)}
        />
      )}

      {/* Temporary entry until other UI provided */}
      <CategoryListItem
        key="services"
        title={t('services')}
        iconName="info"
        onPress={() => navigation.navigate(SERVICES_FLOW)}
      />
    </Container>
  );
}

export default AssetsSection;

const Container = styled.View``;
