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
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import TabView from 'components/modern/TabView';

// Constants
import { ASSET_CATEGORY as CATEGORY } from 'constants/assetsConstants';

// Utils
import { useAssetCategoriesConfig } from 'utils/uiConfig';

// Types
import type { AssetCategory } from 'models/AssetCategory';

// Local
import WalletTab from './wallet/WalletTab';
import DepositsTab from './deposits/DepositsTab';
import InvestmentsTab from './investments/InvestmentsTab';
import LiquidityPoolsTab from './liquidityPools/LiquidityPoolsTab';
import CollectiblesTab from './collectibles/CollectiblesTab';


function Assets() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const config = useAssetCategoriesConfig();

  const items = [
    { key: CATEGORY.WALLET, title: config[CATEGORY.WALLET].title, component: WalletTab },
    { key: CATEGORY.DEPOSITS, title: config[CATEGORY.DEPOSITS].title, component: DepositsTab },
    { key: CATEGORY.INVESTMENTS, title: config[CATEGORY.INVESTMENTS].title, component: InvestmentsTab },
    { key: CATEGORY.LIQUIDITY_POOLS, title: config[CATEGORY.LIQUIDITY_POOLS].title, component: LiquidityPoolsTab },
    // Temporarily hide rewards tab until rewards fetching is implemented
    // { key: CATEGORY.REWARDS, title: config[CATEGORY.REWARDS].title, component: RewardsTab },
    { key: CATEGORY.COLLECTIBLES, title: config[CATEGORY.COLLECTIBLES].title, component: CollectiblesTab },
  ];

  const initialCategory: ?AssetCategory = navigation.getParam('category');

  const initialTabIndex = items.findIndex((item) => item.key === initialCategory);
  const [tabIndex, setTabIndex] = React.useState(initialTabIndex >= 0 ? initialTabIndex : 0);

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title.assets') }]}
        navigation={navigation}
        noPaddingTop
      />
      <TabView items={items} tabIndex={tabIndex} onTabIndexChange={setTabIndex} scrollEnabled />
    </Container>
  );
}

export default Assets;
