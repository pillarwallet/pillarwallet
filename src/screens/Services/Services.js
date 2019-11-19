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
import type { NavigationScreenProp } from 'react-navigation';
import { TouchableOpacity, FlatList, Image } from 'react-native';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import { baseColors, fontStyles } from 'utils/variables';
import { EXCHANGE } from 'constants/navigationConstants';
import { BaseText, MediumText } from 'components/Typography';

type Props = {
  navigation: NavigationScreenProp<*>,
};

// TODO: Icons
const genericIcon = require('assets/images/tokens/genericToken.png');

const Screen = styled(Container)`
  background-color: ${baseColors.surface};
`;

const HeaderWrapper = styled(Wrapper)`
  background-color: ${baseColors.white};
`;

const ServicesWrapper = styled(Wrapper)``;

const ListItem = styled(TouchableOpacity)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

const ItemDetails = styled.View`
  flex-grow: 1;
  margin-left: 20px;
`;

const ItemTitle = styled(MediumText)`
  color: ${baseColors.text};
  ${fontStyles.regular};
`;

const ItemDescription = styled(BaseText)`
  color: ${baseColors.text};
  ${fontStyles.regular};
`;

const goToExchange = (props: Props) => {
  const { navigation } = props;
  navigation.navigate(EXCHANGE);
};

const servicesItems = () => {
  return [
    {
      key: 'exchange',
      title: 'Exchange',
      description: 'Swap between tokens and stablecoins',
      onPress: goToExchange,
    },
  ];
};

const ServicesScreen = (props: Props) => {
  return (
    <Screen inset={{ bottom: 0 }}>
      <HeaderWrapper>
        <Header title="services" />
      </HeaderWrapper>

      <ServicesWrapper>
        <FlatList
          data={servicesItems()}
          contentContainerStyle={{ width: '100%' }}
          renderItem={({
            item: {
              key,
              title,
              description,
              onPress,
            },
          }) => (
            <ListItem
              key={key}
              onPress={() => onPress(props)}
            >
              <Image
                style={{
                  width: 64,
                  height: 64,
                }}
                resizeMode="contain"
                source={genericIcon}
              />
              <ItemDetails>
                <ItemTitle>{title}</ItemTitle>
                <ItemDescription>{description}</ItemDescription>
              </ItemDetails>
            </ListItem>
          )}
        />
      </ServicesWrapper>
    </Screen>
  );
};

export default ServicesScreen;
