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
import { FlatList } from 'react-native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { format as formatDate } from 'date-fns';

import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import { BoldText, BaseText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import CollapsibleListItem from 'components/ListItem/CollapsibleListItem';
import Separator from 'components/Separator';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import type { Assets } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  assets: Assets,
};

type State = {
  openCollapseKey: string,
};

const SectionTitle = styled(BoldText)`
  font-size: ${fontSizes.medium}px;
  margin: 16px;
  margin-bottom: 10px;
`;

const ProviderItem = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${spacing.large}px;
  padding-left: 44px;
`;

const ProviderName = styled(BaseText)`
  font-size: ${fontSizes.small}px;
`;

const ProviderStatus = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.isPending ? baseColors.darkGray : baseColors.jadeGreen}
`;

const DisconnectButton = styled.TouchableOpacity`
  padding: 10px;
  margin-right: -10px;
`;

const DisconnectButtonLabel = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.burningFire}
`;

const genericToken = require('assets/images/tokens/genericToken.png');

const PENDING = 'pending';

const dummyProviders = [
  {
    id: 'UNISWAP',
    name: 'Uniswap',
    status: 'pending',
  },
  {
    id: 'ZEROX',
    name: '0x',
    status: 'unlocked',
  },
  {
    id: 'CHANGELLY',
    name: 'Changelly',
    status: 'unlocked',
  },
];

const dummyExchanges = [
  {
    id: 'UNISWAP',
    name: 'Uniswap',
    dateConnected: +new Date(),
  },
  {
    id: 'SHAPESHIFT',
    name: 'ShapeShift',
    dateConnected: +new Date(),
  },
];

class ExchangeInfo extends React.Component<Props, State> {
  state = {
    openCollapseKey: '',
  };

  toggleCollapse = (key: string) => {
    const { openCollapseKey } = this.state;
    if (openCollapseKey === key) {
      this.setState({ openCollapseKey: '' });
    } else {
      this.setState({ openCollapseKey: key });
    }
  };

  renderProvider = ({ item: provider }: Object) => {
    return (
      <ProviderItem>
        <ProviderName>{provider.name}</ProviderName>
        <ProviderStatus isPending={provider.status === PENDING}>{provider.status}</ProviderStatus>
      </ProviderItem>
    );
  };

  renderToken = ({ item: token }: Object) => {
    const { openCollapseKey } = this.state;
    const fullIconUrl = `${SDK_PROVIDER}/${token.iconUrl}?size=3`;

    return (
      <CollapsibleListItem
        label={token.symbol}
        open={openCollapseKey === token.id}
        onPress={() => this.toggleCollapse(token.id)}
        customToggle={(
          <ListItemWithImage
            label={token.name}
            itemImageUrl={fullIconUrl || genericToken}
            fallbackSource={genericToken}
          />
        )}
        collapseContent={
          <FlatList
            data={dummyProviders}
            keyExtractor={(item) => item.id}
            renderItem={this.renderProvider}
            initialNumToRender={8}
            onEndReachedThreshold={0.5}
            style={{ width: '100%', paddingLeft: 2 }}
            ItemSeparatorComponent={() => <Separator />}
          />
        }
      />
    );
  };

  renderExchange = ({ item: exchange }: Object) => {
    const { name, dateConnected } = exchange;
    const dateToShow = formatDate(new Date(dateConnected), 'MM.DD.YY');
    return (
      <ListItemWithImage
        label={name}
        itemImageUrl={genericToken}
        fallbackSource={genericToken}
        subtext={`Connected ${dateToShow}`}
        customAddon={(
          <DisconnectButton onPress={() => {}}>
            <DisconnectButtonLabel>Disconnect</DisconnectButtonLabel>
          </DisconnectButton>
        )}
      />
    );
  }

  render() {
    const { navigation, assets } = this.props;
    const assetsArray = Object.keys(assets).map(id => assets[id]);
    return (
      <Container>
        <Header title="exchange settings" onBack={() => navigation.goBack(null)} />
        <ScrollWrapper>
          <SectionTitle>Connected exchanges:</SectionTitle>
          <FlatList
            data={dummyExchanges}
            keyExtractor={(item) => item.id}
            renderItem={this.renderExchange}
            initialNumToRender={8}
            onEndReachedThreshold={0.5}
            style={{ width: '100%' }}
            // refreshControl={
            //   <RefreshControl
            //     refreshing={false}
            //     onRefresh={() => {}}
            //   />
            // }
          />
          <SectionTitle>Enabled assets:</SectionTitle>
          <FlatList
            data={assetsArray}
            keyExtractor={(item) => item.id}
            renderItem={this.renderToken}
            initialNumToRender={8}
            onEndReachedThreshold={0.5}
            style={{ width: '100%' }}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            // refreshControl={
            //   <RefreshControl
            //     refreshing={false}
            //     onRefresh={() => {}}
            //   />
            // }
          />
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
}) => ({
  assets,
});

export default connect(mapStateToProps)(ExchangeInfo);
