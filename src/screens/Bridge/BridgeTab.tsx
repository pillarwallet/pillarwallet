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
import Exchange_Crosschain from './Exchange-CrossChain/ExchangeCrosschain';

// services
import etherspotService from 'services/etherspot';

function BridgeTab() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [tabIndex, setTabIndex] = React.useState(0);
  const [customTitle, setCustomTitle] = React.useState(t('exchangeContent.title.initialExchange'));

  const items = [
    { key: CATEGORY.EXCHANGE, title: CATEGORY.EXCHANGE, component: Exchange_Crosschain },
    { key: CATEGORY.CROSS_CHAIN, title: CATEGORY.CROSS_CHAIN, component: Exchange_Crosschain },
  ];

  React.useEffect(() => {
    callFunction();
  }, []);
  const callFunction = async () => {
    const list = await etherspotService.supportedCrossChain();
    console.log('SUPPOTTED LIST', list);
  };

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: customTitle }]}
        navigation={navigation}
        noPaddingTop
      />
      <TabView
        items={items}
        tabIndex={tabIndex}
        onTabIndexChange={setTabIndex}
        fetchTitle={setCustomTitle}
        isCrosschain={tabIndex === 1}
      />
    </Container>
  );
}

export default BridgeTab;
