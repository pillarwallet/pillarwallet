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
  SectionList,
} from 'react-native';
import styled from 'styled-components/native';
import isEqualWith from 'lodash.isequalwith';
import type { NavigationScreenProp } from 'react-navigation';

// components
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import Title from 'components/Title';
import BadgeTouchableItem from 'components/BadgeTouchableItem';

// actions
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { fetchBadgesAction } from 'actions/badgesActions';

// constants
import { COLLECTIBLE, BADGE } from 'constants/navigationConstants';
import { COLLECTIBLES, BADGES } from 'constants/assetsConstants';

// utils
import { smallScreen } from 'utils/common';
import { spacing } from 'utils/variables';

// types
import type { Collectible } from 'models/Collectible';
import type { Badges } from 'models/Badge';

const EmptyStateWrapper = styled.View`
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const StyledTitle = styled(Title)`
  margin: ${spacing.medium}px 2px;
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
  updateHideRemoval: Function,
  fetchBadges: Function,
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
        icon={item.thumbnail || item.icon}
        smallScreen={smallScreen()}
        onPress={() => { this.handleCardTap(item); }}
        isCollectible
        columnCount={2}
        useSVGShadow
      />
    );
  };

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { id: item.id })}
      />
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
      badges,
      fetchAllCollectiblesData,
      fetchBadges,
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

    const sectionData = [
      {
        key: COLLECTIBLES,
        title: 'all collectibles.',
        data: [collectibles],
        emptyStateInfo: {
          title: 'No collectibles',
          bodyText: 'There are no collectibles in this wallet',
        },
      },
    ];

    if (badges.length) {
      sectionData.unshift({
        key: BADGES,
        title: 'game of badges.',
        data: [badges],
      });
    }

    return (
      <SectionList
        sections={sectionData}
        renderSectionHeader={({ section }) => {
          if (sectionData.length > 1 && section.title) { // no need to show SectionList title if there's only 1 section
            return (
              <StyledTitle noMargin style={{ marginLeft: spacing.mediumLarge }} subtitle title={section.title} />
            );
          }
          return null;
        }}
        contentContainerStyle={sectionData.length === 1 && !collectibles.length
        ? {
            justifyContent: 'center',
            flex: 1,
          }
        : {}}
        stickySectionHeadersEnabled={false}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchAllCollectiblesData();
              fetchBadges();
            }}
          />
        }
        onScroll={() => Keyboard.dismiss()}
        renderItem={({ item, section }) => (
          <FlatList
            data={item}
            horizontal={section.key === BADGES}
            keyExtractor={(it) => {
              return section.key === COLLECTIBLE ? `${it.assetContract}${it.id}` : it.id.toString();
            }}
            renderItem={section.key === COLLECTIBLES ? this.renderCollectible : this.renderBadge}
            numColumns={section.key === COLLECTIBLES ? 2 : 1}
            style={[
              { width: '100%' },
              section.key === COLLECTIBLES ? { paddingHorizontal: 10 } : {},
              ]}
            contentContainerStyle={section.key === BADGES ? { paddingHorizontal: 10 } : {}}
            ListEmptyComponent={
              <EmptyStateWrapper fullScreen>
                <EmptyStateParagraph {...section.emptyStateInfo} />
              </EmptyStateWrapper>
            }
            initialNumToRender={section.key === BADGES ? 5 : 4}
            removeClippedSubviews={section.key === COLLECTIBLES}
            viewabilityConfig={viewConfig}
          />
        )}
      />
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchBadges: () => dispatch(fetchBadgesAction()),
});

export default connect(null, mapDispatchToProps)(CollectiblesList);
