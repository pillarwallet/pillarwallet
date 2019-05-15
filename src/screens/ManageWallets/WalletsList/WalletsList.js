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
import { RefreshControl, FlatList } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';

// components
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { spacing, baseColors } from 'utils/variables';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';

// actions
import { fetchICOsAction } from 'actions/icosActions';

// constants
import { WALLET_SETTINGS } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const SelectLabel = styled(BaseText)`
  color: ${baseColors.electricBlue};
`;

const ButtonWrapper = styled.View`
  flex-grow: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px 20px 40px;
`;

const SelectButton = styled.TouchableOpacity`
  padding: 10px;
  margin-right: -10px;
`;

class WalletsList extends React.PureComponent<Props> {
  renderWalletListItem = ({ item }) => {
    const { navigation } = this.props;
    return (
      <ListItemWithImage
        label={item.title}
        customAddon={
          <SelectButton onPress={() => navigation.navigate(WALLET_SETTINGS, { item })}>
            <SelectLabel>Select</SelectLabel>
          </SelectButton>
        }
      />
    );
  };

  render() {
    const { navigation } = this.props;
    const mockupWallets = [
      {
        id: 0,
        title: 'Smart wallet',
      },
      {
        id: 1,
        title: 'Boring Wallet',
      },
      {
        id: 2,
        title: 'Boring Wallet',
      },
      {
        id: 3,
        title: 'Boring Wallet',
      },
      {
        id: 4,
        title: 'Boring Wallet',
      },
      {
        id: 5,
        title: 'Boring Wallet',
      },
      {
        id: 6,
        title: 'Boring Wallet',
      },
      {
        id: 7,
        title: 'Boring Wallet',
      },
      {
        id: 8,
        title: 'Boring Wallet',
      },
      {
        id: 9,
        title: 'Boring Wallet',
      },
      {
        id: 10,
        title: 'Boring Wallet',
      },
      {
        id: 11,
        title: 'Boring Wallet',
      },
    ];

    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title="your wallets"
          onBack={() => navigation.goBack(null)}
        />
        <FlatList
          data={mockupWallets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={this.renderWalletListItem}
          initialNumToRender={8}
          contentContainerStyle={{
            paddingVertical: spacing.rhythm,
            paddingTop: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
            />
          }
          style={{ flexGrow: 0 }}
        />
        <ButtonWrapper>
          <Button title="Add Smart Wallet" onPress={() => {}} />
        </ButtonWrapper>
      </Container >
    );
  }
}

const mapStateToProps = ({ icos: { data: icos }, user: { data: user } }) => ({
  icos,
  user,
});

const mapDispatchToProps = (dispatch) => ({
  fetchICOs: () => dispatch(fetchICOsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletsList);
