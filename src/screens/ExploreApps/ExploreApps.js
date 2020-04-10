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
import { FlatList, Image } from 'react-native';
import { type NavigationScreenProp, withNavigation } from 'react-navigation';
import styled from 'styled-components/native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { MediumText, BaseText } from 'components/Typography';
import { fontStyles } from 'utils/variables';
import Button from 'components/Button';
import { themedColors } from 'utils/themes';
import ExploreAppsInfoCard from './ExploreAppsInfoCard';

interface Props {
  navigation: NavigationScreenProp<*>
}

type AppItem = {
  name: string,
  logo: number,
  text: string,
  url: string,
}

const AppItemWrapper = styled.View`
  padding: 20px 0px;
`;

const AppItemRowWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const AppName = styled(MediumText)`
  ${fontStyles.big};
`;

const AppText = styled(BaseText)`
  ${fontStyles.medium};
  margin-left: 63px;
  color: ${themedColors.secondaryText};
`;

const ButtonWrapper = styled.View`
  position: absolute;
  right: 0;
`;

const CardWrapper = styled.View`
  margin-bottom: 20px;
`;

const zerionLogo = require('assets/images/apps/zerion.png');

const APPS: AppItem[] = [
  {
    name: 'Zerion',
    logo: zerionLogo,
    text: 'A simple interface to access decentralized finance to invest, earn interest and borrow crypto assets.',
    url: '',
  },
];

class ExploreApps extends React.PureComponent<Props> {
    handleCardButton = () => {
      //
    }

    handleAppUrl = (url: string) => {
      console.log(url); // todo
    }

    renderItem = ({ item }: { item: AppItem }) => {
      return (
        <AppItemWrapper >
          <AppItemRowWrapper>

            <Image source={item.logo} style={{ height: 48, width: 48, marginRight: 15 }} />
            <AppName>{item.name}</AppName>
            <ButtonWrapper>
              <Button
                title="View"
                onPress={() => this.handleAppUrl(item.url)}
                small
                height={32}
                horizontalPaddings={9}
              />
            </ButtonWrapper>
          </AppItemRowWrapper>
          <AppText>{item.text}</AppText>
        </AppItemWrapper>
      );
    }

    render() {
      return (
        <ContainerWithHeader
          navigation={this.props.navigation}
          headerProps={{
            centerItems: [{ title: 'Explore apps' }],
          }}
        >
          <FlatList
            style={{ paddingHorizontal: 20, paddingTop: 20 }}
            ListHeaderComponent={
              <CardWrapper><ExploreAppsInfoCard onButtonPress={this.handleCardButton} /></CardWrapper>
              }
            data={APPS}
            renderItem={this.renderItem}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.name}
          />
        </ContainerWithHeader>
      );
    }
}


export default withNavigation(ExploreApps);
