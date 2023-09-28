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
import { useTranslation } from 'translations/translate';
import type { NativeStackNavigationProp as NavigationScreenProp } from '@react-navigation/native-stack';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import TabView from 'components/layout/TabView';

// Constants
import { ASSET_CATEGORY as CATEGORY } from 'constants/assetsConstants';

// Selector
import { useNftFlag } from 'selectors';

// Utils
import { useAssetCategoriesConfig } from 'utils/uiConfig';

// Types
import type { AssetCategory } from 'models/AssetCategory';
import type { Route } from '@react-navigation/native';

// Local
import WalletTab from './wallet/WalletTab';
import InvestmentsTab from './investments/InvestmentsTab';
import CollectiblesTab from './collectibles/CollectiblesTab';

type Props = {
  onBackPress?: () => void,
  navigation: NavigationScreenProp<*>,
  route: Route,
};

function Assets({ onBackPress, navigation, route }: Props) {
  const { t } = useTranslation();
  const config = useAssetCategoriesConfig();
  const visibleNFTs = useNftFlag();

  const items = [
    { key: CATEGORY.WALLET, title: config[CATEGORY.WALLET].title, component: WalletTab },
    // { key: CATEGORY.DEPOSITS, title: config[CATEGORY.DEPOSITS].title, component: DepositsTab },
    // { key: CATEGORY.INVESTMENTS, title: config[CATEGORY.INVESTMENTS].title, component: InvestmentsTab },
    { key: CATEGORY.APPS, title: config[CATEGORY.APPS].title, component: InvestmentsTab },
    // Temporarily hide rewards tab until rewards fetching is implemented
    // { key: CATEGORY.REWARDS, title: config[CATEGORY.REWARDS].title, component: RewardsTab },
  ];

  if (visibleNFTs) {
    items.push({ key: CATEGORY.COLLECTIBLES, title: config[CATEGORY.COLLECTIBLES].title, component: CollectiblesTab });
  }

  const initialCategory: ?AssetCategory = route?.params?.category;

  const initialTabIndex = items.findIndex((item) => item.key === initialCategory);
  const [tabIndex, setTabIndex] = React.useState(initialTabIndex >= 0 ? initialTabIndex : 0);

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title.assets') }]}
        noPaddingTop
        navigation={navigation}
        customOnBack={() => (onBackPress ? onBackPress() : navigation.pop())}
      />
      <TabView items={items} tabIndex={tabIndex} onTabIndexChange={setTabIndex} isNavigateToHome={!!onBackPress} />
    </Container>
  );
}

export default Assets;
