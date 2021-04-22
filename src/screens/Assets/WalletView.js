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

// Components
import TabView from 'components/modern/TabView';

// Contants
import { ASSET_CATEGORIES as CATEGORY } from 'constants/assetsConstants';

// Utils
import { useAssetCategoriesConfig } from 'utils/uiConfig';

// Local
import WalletTab from './tabs/WalletTab';
import BaseTab from './tabs/BaseTab';

type Props = {};

function WalletView(props: Props) {
  const [tabIndex, setTabIndex] = React.useState(0);

  const config = useAssetCategoriesConfig();

  const items = [
    { key: CATEGORY.WALLET, title: config[CATEGORY.WALLET].title, component: WalletTab },
    { key: CATEGORY.DEPOSITS, title: config[CATEGORY.DEPOSITS].title, component: BaseTab },
    { key: CATEGORY.INVESTMENTS, title: config[CATEGORY.INVESTMENTS].title, component: BaseTab },
    { key: CATEGORY.LIQUIDITY_POOLS, title: config[CATEGORY.LIQUIDITY_POOLS].title, component: BaseTab },
    { key: CATEGORY.COLLECTIBLES, title: config[CATEGORY.COLLECTIBLES].title, component: BaseTab },
    { key: CATEGORY.REWARDS, title: config[CATEGORY.REWARDS].title, component: BaseTab },
    { key: CATEGORY.DATASETS, title: config[CATEGORY.DATASETS].title, component: BaseTab },
  ];

  return <TabView items={items} tabIndex={tabIndex} onTabIndexChange={setTabIndex} scrollEnabled />;
}

export default WalletView;
