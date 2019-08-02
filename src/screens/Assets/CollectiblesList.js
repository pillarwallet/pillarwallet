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

import { FlatList, RefreshControl, View } from 'react-native';
import styled from 'styled-components/native';
import isEqualWith from 'lodash.isequalwith';
import type { NavigationScreenProp } from 'react-navigation';
import { CachedImage } from 'react-native-cached-image';

// components
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import ShadowedCard from 'components/ShadowedCard';

// actions
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { fetchBadgesAction } from 'actions/badgesActions';

// constants
import { COLLECTIBLE, BADGE } from 'constants/navigationConstants';

// utils
import { smallScreen } from 'utils/common';
import { baseColors, fontSizes, fontTrackings, spacing } from 'utils/variables';

// types
import type { Collectible } from 'models/Collectible';
import type { Badges } from 'models/Badge';
import { BaseText } from '../../components/Typography';

const EmptyStateWrapper = styled.View`
  align-items: center;
  justify-content: center;
  padding: 20px;
  flex-grow: 1;
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
`;

const Name = styled(BaseText)`
  font-size: ${props => props.smallScreen ? fontSizes.extraExtraSmall : fontSizes.extraSmall}px;
  letter-spacing: ${fontTrackings.small};
  line-height: ${fontSizes.small}px;
  color: ${baseColors.darkGray};
  width: 100%; 
  text-align: center;
`;

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type Props = {
  collectibles: Collectible[],
  badges: Badges,
  searchQuery: string,
  navigation: NavigationScreenProp<*>,
  horizontalPadding: Function,
  fetchAllCollectiblesData: Function,
  fetchBadges: Function,
}

const genericToken = require('assets/images/tokens/genericToken.png');

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
    const { navigation } = this.props;
    navigation.navigate(COLLECTIBLE, { assetData });
  };

  renderCollectible = ({ item }) => {
    const { name, thumbnail, icon: itemIcon } = item;
    const icon = thumbnail || itemIcon;
    return (
      <View style={{ width: '50%', paddingHorizontal: 8, paddingVertical: 3 }}>
        <ShadowedCard
          wrapperStyle={{ marginBottom: 10, width: '100%' }}
          contentWrapperStyle={{ padding: spacing.medium, alignItems: 'center' }}
          onPress={() => { this.handleCardTap(item); }}
        >
          <CachedImage
            key={name}
            style={{
              height: 135,
              width: 135,
              marginBottom: spacing.mediumLarge,
            }}
            source={{ uri: icon }}
            fallbackSource={genericToken}
            resizeMode="contain"
          />
          <CardRow>
            <Name center numberOfLines={1} ellipsizeMode="tail" smallScreen={smallScreen()}>{name}</Name>
          </CardRow>
        </ShadowedCard>
      </View>
    );
  };

  renderItem = (item) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { id: item.id })}
      />
    );
  };

  render() {
    const {
      searchQuery,
      fetchAllCollectiblesData,
      collectibles,
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
        keyExtractor={(it) => { return `${it.assetContract}${it.id}`; }}
        renderItem={this.renderCollectible}
        numColumns={2}
        style={[searchQuery ? { flexGrow: 1, paddingTop: spacing.mediumLarge } : { flexGrow: 1 }]}
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyStateWrapper>
            <EmptyStateParagraph {...emptyStateInfo} />
          </EmptyStateWrapper>
        }
        initialNumToRender={4}
        removeClippedSubviews
        viewabilityConfig={viewConfig}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchAllCollectiblesData();
            }}
          />
        }
      />
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchBadges: () => dispatch(fetchBadgesAction()),
});

export default connect(null, mapDispatchToProps)(CollectiblesList);
