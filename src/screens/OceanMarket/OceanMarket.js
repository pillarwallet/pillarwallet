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

import React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Spacing } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import { FlatList, RefreshControl } from 'react-native';
import { AVAILABLE_DATASETS } from 'screens/OceanMarket/mocks';
import { Row } from 'components/Grid';
import Button from 'components/Button';


type Props = {
  navigation: NavigationScreenProp<*>,
};

const dataSetActive = require('assets/images/tokens-48-ocean-protocol.png');
const dataSetGrey = require('assets/images/tokens-48-ocean-protocol-grey.png');

const listContainerStyle = {
  paddingVertical: 24,
  paddingHorizontal: 20,
};

const BalanceContainer = styled.View`
  padding: 16px;
  border-radius: 8px;
  background-color: #ffffff;
`;

const BalanceRow = styled(Row)`
  align-items: center;
`;

const BalanceValues = styled.View`
  flex: 1;
`;

const DataSetItemContainer = styled.TouchableOpacity`
  height: 76px;
  flex-direction: row;
  align-items: center;
`;

const Image = styled.Image`
  width: 48px;
  height: 48px;
  resize-mode: contain;
`;

const Header = styled.View`
  
`;

const DataSetItemTitle = styled(MediumText)`
  flex: 1;
`;

const OceanMarketScreen = ({
  navigation,
}: Props) => {
  const renderDataSetListItem = ({ item }) => (
    <DataSetItemContainer>
      <Image source={dataSetActive} />
      <Spacing w={12} />
      <DataSetItemTitle big>{item.title}</DataSetItemTitle>
      <Spacing w={12} />
      <BaseText big>{`$${item.price.toFixed(2)}`}</BaseText>
    </DataSetItemContainer>
  );

  const renderHeader = () => (
    <Header>
      <MediumText big>{t('oceanMarketContent.oceanMarketContent.subtitle.balance')}</MediumText>
      <Spacing h={14} />
      <BalanceContainer>
        <BalanceRow>
          <Image source={dataSetGrey} />
          <Spacing w={8} />
          <BalanceValues>
            <BalanceRow>
              <MediumText big>0</MediumText>
              <Spacing w={4} />
              <BaseText secondary regular>{t('oceanMarketContent.oceanMarketContent.subtitle.ocean')}</BaseText>
            </BalanceRow>
            <BalanceRow>
              <BaseText secondary regular>$0</BaseText>
            </BalanceRow>
          </BalanceValues>
          <Spacing w={8} />
          <Button block={false} small title={t('oceanMarketContent.oceanMarketContent.buttons.buy')} />
        </BalanceRow>
        <Spacing h={20} />
        <BaseText secondary regular>{t('oceanMarketContent.oceanMarketContent.paragraph.balance')}</BaseText>
      </BalanceContainer>
      <Spacing h={36} />
      <MediumText big>{t('oceanMarketContent.oceanMarketContent.subtitle.availableDatasets')}</MediumText>
      <Spacing h={14} />
    </Header>
  );

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('oceanMarketContent.title.oceanMarket') }],
      }}
    >
      <FlatList
        contentContainerStyle={listContainerStyle}
        ListHeaderComponent={renderHeader}
        data={AVAILABLE_DATASETS}
        renderItem={renderDataSetListItem}
        keyExtractor={dataSet => dataSet.id}
      />
    </ContainerWithHeader>
  );
};

export default OceanMarketScreen;
