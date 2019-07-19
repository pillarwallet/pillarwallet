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
import styled from 'styled-components/native';
import isEqual from 'lodash.isequal';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';

// components
import { BaseText, BoldText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ShadowedCard from 'components/ShadowedCard';
import { Note } from 'components/Note';

// utils
import { baseColors } from 'utils/variables';

// types
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { PILLAR_NETWORK_INTRO, ASSETS, WALLETS_LIST } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { setActiveBNetworkAction } from 'actions/blockchainNetworkActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  setActiveBNetwork: Function,
  blockchainNetworks: Object[],
}

type CardProps = {
  icon: string,
  title: string,
  subtitle?: string,
  action?: Function,
  note?: Object,
}

const CardRow = styled.View`
   flex-direction: row;
   width: 100%;
   align-items: center;
`;

const CardImage = styled(CachedImage)`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${baseColors.darkGray};
  margin-right: 20px;
`;

const CardContent = styled.View`
  flex-direction: column;
`;

const CardTitle = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: 17px;
  width: 100%;
`;

const CardSubtitle = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: 13px;
  line-height: 15px;
  margin-top: 4px;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

const ppnInitButton = {
  id: 'INIT_PPN',
  title: 'Pillar Network',
  isNotConnected: true,
};

const Card = (props: CardProps) => {
  const {
    icon,
    title,
    subtitle,
    action,
    note,
  } = props;

  return (
    <ShadowedCard
      wrapperStyle={{ marginBottom: 10, width: '100%' }}
      contentWrapperStyle={{ padding: 20 }}
      onPress={action}
    >
      <CardRow>
        <CardImage source={{ uri: icon }} fallbackSource={genericToken} />
        <CardContent>
          <CardTitle>{title}</CardTitle>
          {!!subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
        </CardContent>
      </CardRow>
      {!!note &&
      <Note {...note} containerStyle={{ marginTop: 14 }} />
      }
    </ShadowedCard>
  );
};

class AccountsScreen extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  setActiveNetwork = (id) => {
    const { setActiveBNetwork, navigation } = this.props;
    setActiveBNetwork(id);
    navigation.navigate(ASSETS);
  };

  renderNetworks = ({ item: network }: Object) => {
    const { navigation } = this.props;
    const { id } = network;

    const ppnNote = {
      note: 'Instant, free and private transactions',
      emoji: 'sunglasses',
    };

    switch (id) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return (
          <Card
            {...network}
            action={() => navigation.navigate(WALLETS_LIST)}
            subtitle="Balance: £130.17"
          />
        );
      case 'INIT_PPN':
        return (
          <Card
            {...network}
            action={() => navigation.navigate(PILLAR_NETWORK_INTRO)}
            note={ppnNote}
          />
        );
      case BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK:
        return (
          <Card
            {...network}
            subtitle="Balance: 0"
            action={() => this.setActiveNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK)}
            note={ppnNote}
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { blockchainNetworks } = this.props;
    const PillarNetwork = blockchainNetworks
      .find(({ id: bnetworkId }) => bnetworkId === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK) || {};

    const networksListData = Object.keys(PillarNetwork).length
      ? blockchainNetworks
      : [...blockchainNetworks, ppnInitButton];

    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          leftItems: [
            { userIcon: true },
            {
              title: 'Accounts',
              color: baseColors.aluminium,
            },
          ],
          rightItems: [{ close: true }],
        }}
      >
        <FlatList
          data={networksListData}
          keyExtractor={(item) => item.id}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20 }}
          renderItem={this.renderNetworks}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  blockchainNetwork: { data: blockchainNetworks },
}) => ({
  blockchainNetworks,
});

const mapDispatchToProps = (dispatch: Function) => ({
  setActiveBNetwork: (id: string) => dispatch(setActiveBNetworkAction(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AccountsScreen);
