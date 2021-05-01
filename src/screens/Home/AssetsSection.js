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
import { LayoutAnimation } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { ASSETS, SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { formatValue, formatFiatValue } from 'utils/format';
import { LIST_ITEMS_APPEARANCE } from 'utils/layoutAnimations';
import { useChainsConfig, useAssetCategoriesConfig } from 'utils/uiConfig';

// Types
import type { CategoryBalancesPerChain, CategoryBalance, CollectibleCountPerChain } from 'models/Home';
import { type AssetCategory, ASSET_CATEGORY } from 'models/AssetCategory';
import { type Chain, CHAIN } from 'models/Chain';

// Local
import CategoryListItem from './components/CategoryListItem';
import ChainListItem from './components/ChainListItem';
import { getTotalCollectibleCount } from './utils';

type Props = {|
  categoryBalances: CategoryBalance,
  categoryBalancesPerChain: CategoryBalancesPerChain,
  collectibleCountPerChain: CollectibleCountPerChain,
|};

type FlagPerCategory = { [AssetCategory]: ?boolean };

function AssetsSection({ categoryBalances, categoryBalancesPerChain, collectibleCountPerChain }: Props) {
  const { t } = useTranslationWithPrefix('home.assets');
  const navigation = useNavigation();

  const [showChainsPerCategory, setShowChainsPerCategory] = React.useState<FlagPerCategory>({});

  const fiatCurrency = useFiatCurrency();

  const chainsConfig = useChainsConfig();
  const categoriesConfig = useAssetCategoriesConfig();

  const totalCollectibleCount = getTotalCollectibleCount(collectibleCountPerChain);

  const toggleShowChains = (category: AssetCategory) => {
    LayoutAnimation.configureNext(LIST_ITEMS_APPEARANCE);
    const previousValue = showChainsPerCategory[category];
    // $FlowFixMe: flow is able to handle this
    setShowChainsPerCategory({ ...showChainsPerCategory, [category]: !previousValue });
  };

  const renderCategoryWithBalance = (category: $Keys<CategoryBalance>) => {
    const balance = categoryBalances[category] ?? BigNumber(0);
    const formattedBalance = formatFiatValue(balance, fiatCurrency);

    const { title, iconName } = categoriesConfig[category];
    const showChains = showChainsPerCategory[category];

    return (
      <React.Fragment key={`${category}-fragment`}>
        <CategoryListItem
          key={`${category}`}
          iconName={iconName}
          title={title}
          value={formattedBalance}
          onPress={() => toggleShowChains(category)}
        />
        {showChains && Object.keys(CHAIN).map((key) => renderChainWithBalance(category, CHAIN[key]))}
      </React.Fragment>
    );
  };

  const renderChainWithBalance = (category: $Keys<CategoryBalance>, chain: Chain) => {
    const balance = categoryBalancesPerChain[chain]?.[category] ?? BigNumber(0);
    const formattedBalance = formatFiatValue(balance, fiatCurrency);

    const { title } = chainsConfig[chain];

    return (
      <ChainListItem
        key={`${category}-${chain}`}
        title={title}
        value={formattedBalance}
        onPress={() => navigation.navigate(ASSETS, { category, chain })}
      />
    );
  };

  const renderCollectiblesCategory = () => {
    const { title, iconName } = categoriesConfig.collectibles;
    const showChains = showChainsPerCategory.collectibles;
    return (
      <React.Fragment key="collectibles-fragment">
        <CategoryListItem
          key="collectibles"
          title={title}
          iconName={iconName}
          onPress={() => toggleShowChains(ASSET_CATEGORY.COLLECTIBLES)}
          value={formatValue(totalCollectibleCount)}
        />
        {showChains && Object.keys(CHAIN).map((key) => renderChainCollectibleCount(CHAIN[key]))}
      </React.Fragment>
    );
  };

  const renderChainCollectibleCount = (chain: Chain) => {
    return (
      <ChainListItem
        key={`collectibles-${chain}`}
        title={chainsConfig[chain].title}
        value={formatValue(collectibleCountPerChain[chain] ?? 0)}
        onPress={() => navigation.navigate(ASSETS, { category: ASSET_CATEGORY.COLLECTIBLES, chain })}
      />
    );
  };

  return (
    <Container>
      {!!categoryBalances && Object.keys(categoryBalances).map((category) => renderCategoryWithBalance(category))}

      {renderCollectiblesCategory()}

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
