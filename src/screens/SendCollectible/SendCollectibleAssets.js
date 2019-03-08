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
import { FlatList, Keyboard, RefreshControl } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import Header from 'components/Header';
import { Container, Wrapper } from 'components/Layout';
import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { smallScreen } from 'utils/common';
import { SEND_COLLECTIBLE_CONFIRM } from 'constants/navigationConstants';

type Props = {
  fetchCollectibles: Function,
  collectibles: Object,
  navigation: NavigationScreenProp<*>,
};

class SendCollectibleAssetsScreen extends React.Component<Props> {
  navigateToNextScreen(assetData) {
    const { navigation } = this.props;
    const contact = navigation.getParam('contact', {});

    navigation.navigate(SEND_COLLECTIBLE_CONFIRM, {
      assetData,
      receiver: contact.ethAddress,
    });
  }

  renderCollectible = ({ item }) => {
    return (
      <AssetCardMinimized
        {...item}
        smallScreen={smallScreen()}
        onPress={() => { this.navigateToNextScreen(item); }}
        isCollectible
        columnCount={2}
      />
    );
  };

  render() {
    const { navigation, collectibles, fetchCollectibles } = this.props;
    const contact = navigation.getParam('contact', {});
    const contactUsername = contact.username;
    return (
      <Container inset={{ bottom: 0 }}>
        <Header title={`send to ${contactUsername}`} centerTitle onBack={navigation.dismiss} />
        <FlatList
          data={collectibles}
          keyExtractor={(item) => item.id}
          renderItem={this.renderCollectible}
          style={{ width: '100%' }}
          contentContainerStyle={{
            paddingVertical: 6,
            paddingLeft: 15,
            paddingRight: 15,
            width: '100%',
            flexGrow: 1,
          }}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => fetchCollectibles()}
            />
          }
          onScroll={() => Keyboard.dismiss()}
          ListEmptyComponent={
            <Wrapper
              fullScreen
              style={{
                paddingTop: 90,
                paddingBottom: 90,
                alignItems: 'center',
              }}
            >
              <EmptyStateParagraph title="No collectibles" bodyText="There are no collectibles in this wallet" />
            </Wrapper>
          }
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  collectibles: { assets: collectibles },
}) => ({
  collectibles,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchCollectibles: () => { dispatch(fetchCollectiblesAction()); },
});

export default connect(mapStateToProps, mapDispatchToProps)(SendCollectibleAssetsScreen);
