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
import { useTranslation } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import TabView from 'components/layout/TabView';

// Constants
import { BRIDGE_CATEGORY as CATEGORY } from 'constants/exchangeConstants';

// Local
import Exchange from './Exchange-CrossChain/Exchange';
import CrossChain from './Exchange-CrossChain/CrossChain';

function BridgeTab() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [tabIndex, setTabIndex] = React.useState(0);
  const [exchangeTitle, setExchangeTitle] = React.useState(t('exchangeContent.title.initialExchange'));
  const [crossChainTitle, setCrossChainTitile] = React.useState(t('exchangeContent.title.crossChain'));

  const items = [
    { key: CATEGORY.EXCHANGE, title: CATEGORY.EXCHANGE, component: Exchange },
    { key: CATEGORY.CROSS_CHAIN, title: CATEGORY.CROSS_CHAIN, component: CrossChain },
  ];

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: tabIndex === 1 ? crossChainTitle : exchangeTitle }]}
        navigation={navigation}
        noPaddingTop
      />
      <TabView
        items={items}
        tabIndex={tabIndex}
        onTabIndexChange={setTabIndex}
        fetchExchangeTitle={setExchangeTitle}
        fetchCrossChainTitle={setCrossChainTitile}
        isCrosschain={tabIndex === 1}
        swipeEnabled={false}
      />
    </Container>
  );
}

export default BridgeTab;
