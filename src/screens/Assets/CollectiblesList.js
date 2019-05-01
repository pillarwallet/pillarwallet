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
import { connect } from 'react-redux';

import {
  RefreshControl,
  FlatList,
  Keyboard,
} from 'react-native';
import styled from 'styled-components/native';
import isEqualWith from 'lodash.isequalwith';
import type { NavigationScreenProp } from 'react-navigation';

// components
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import { Wrapper } from 'components/Layout';

// actions
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

// constants
import { EXTRASMALL } from 'constants/assetsLayoutConstants';
import { COLLECTIBLE } from 'constants/navigationConstants';

// utils
import { smallScreen } from 'utils/common';

// types
import type { Collectible } from 'models/Collectible';


const EmptyStateWrapper = styled(Wrapper)`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type Props = {
  collectibles: Collectible[],
  searchQuery: string,
  navigation: NavigationScreenProp<*>,
  horizontalPadding: Function,
  fetchAllCollectiblesData: Function,
  updateHideRemoval: Function,
}

class CollectiblesList extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    });
    return !isEq;
  }

  handleCardTap = (assetData: Object) => {
    const { navigation, updateHideRemoval } = this.props;
    updateHideRemoval(true);
    navigation.navigate(COLLECTIBLE, { assetData });
  };

  renderCollectible = ({ item }) => {
    return (
      <AssetCardMinimized
        {...item}
        smallScreen={smallScreen()}
        onPress={() => { this.handleCardTap(item); }}
        isCollectible
        columnCount={2}
      />
    );
  };

  render() {
    const {
      fetchAllCollectiblesData,
      collectibles,
      searchQuery,
      horizontalPadding,
    } = this.props;

    const emptyStateInfo = {
      title: 'No collectibles',
      bodyText: 'There are no collectibles in this wallet',
    };

    if (searchQuery) {
      emptyStateInfo.title = 'Collectible not found';
      emptyStateInfo.bodyText = 'Check if the name was entered correctly';
    }

    return (
      <FlatList
        data={collectibles}
        keyExtractor={item => `${item.assetContract}${item.id}`}
        renderItem={this.renderCollectible}
        style={{ width: '100%' }}
        contentContainerStyle={{
          paddingVertical: 6,
          paddingLeft: horizontalPadding(EXTRASMALL, 'left'),
          paddingRight: horizontalPadding(EXTRASMALL, 'right'),
          width: '100%',
        }}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => fetchAllCollectiblesData()}
          />
        }
        onScroll={() => Keyboard.dismiss()}
        ListEmptyComponent={
          <EmptyStateWrapper fullScreen>
            <EmptyStateParagraph {...emptyStateInfo} />
          </EmptyStateWrapper>
        }
        initialNumToRender={10}
        removeClippedSubviews
        viewabilityConfig={viewConfig}
      />
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
});

export default connect(null, mapDispatchToProps)(CollectiblesList);
