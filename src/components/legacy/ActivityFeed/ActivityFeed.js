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
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';

// types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';

// components
import Title from 'components/legacy/Title';
import Tabs from 'components/legacy/Tabs';
import { BaseText, MediumText } from 'components/legacy/Typography';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ActivityFeedItem from 'components/legacy/ActivityFeed/ActivityFeedItem';
import EventDetails, { shouldShowEventDetails } from 'components/legacy/EventDetails';
import Modal from 'components/Modal';

// utils
import { groupSectionsByDate } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';

// constants
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { LIGHT_THEME } from 'constants/appSettingsConstants';
import { EVENT_TYPE } from 'models/History';


const ActivityFeedList = styled.FlatList`
  width: 100%;
  flex: 1;
`;

const ActivityFeedWrapper = styled.View`
  flex: 1;
`;

const ActivityFeedHeader = styled.View`
  padding: ${spacing.mediumLarge}px ${spacing.large}px 0;
`;

const SectionHeaderWrapper = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px;
`;

const SectionHeader = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic010};
`;

const EmptyStateWrapper = styled.View`
  padding: 15px 30px 30px;
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const CardHeaderWrapper = styled.View`
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  background-color: ${({ theme }) => theme.colors.basic050};
  padding: 13px 20px 17px;
  margin-top: 16px;
  ${({ theme }) => theme.current === LIGHT_THEME && `
    box-shadow: 0px 2px 7px rgba(0,0,0,.1);
    elevation: 1;
  `}
`;

const CardBackgroundWrapper = styled.View`
  ${({ theme, card }) => card && `background-color: ${theme.colors.basic050};`}
`;

type EmptyState = {|
  title?: string,
  textBody?: string,
|};

type Tab = {|
  id: string,
  name: string,
  icon?: string,
  onPress: Function,
  unread?: number,
  tabImageNormal?: string,
  tabImageActive?: string,
  data: Object[],
  emptyState?: EmptyState,
|};

type Props = {
  navigation: NavigationScreenProp<*>,
  feedTitle?: string,
  wrapperStyle?: Object,
  contentContainerStyle?: Object,
  initialNumToRender: number,
  tabs?: Tab[],
  activeTab?: string,
  feedData?: Object[],
  extraFeedData?: Object[],
  hideTabs: boolean,
  emptyState?: EmptyState,
  ensRegistry: EnsRegistry,
  tabsComponent?: React.Node,
  headerComponent?: React.Node,
  flatListProps?: React.ElementConfig<typeof FlatList>,
  isPPNView?: boolean,
  isForAllAccounts?: boolean,
  isAssetView?: boolean,
  card?: boolean,
  cardHeaderTitle?: string,
  contantContainerStyle?: ViewStyleProp,
};

const ITEM_TYPE = {
  HEADER: 'HEADER',
  TABS: 'TABS',
  SECTION: 'SECTION',
  ITEM: 'ITEM',
  EMPTY_STATE: 'EMPTY_STATE',
  CARD_HEADER: 'CARD_HEADER',
};

/**
 * @deprecated This compontent is considered legacy and should not be used in new code
 */
class ActivityFeed extends React.Component<Props> {
  static defaultProps = {
    initialNumToRender: 7,
  };

  generateFeedSections = (tabs, activeTab, feedData, headerComponent, tabsComponent, card) => {
    let feedList = feedData || [];

    if (tabs.length) {
      const activeTabInfo = tabs.find(({ id }) => id === activeTab);
      if (activeTabInfo) ({ data: feedList } = activeTabInfo);
    }

    const items = [
      { type: ITEM_TYPE.HEADER, component: headerComponent },
      { type: ITEM_TYPE.TABS, component: tabsComponent },
    ];

    const filteredFeedList = feedList.filter(this.shouldRenderActivityItem);
    if (!filteredFeedList.length) {
      return [
        ...items,
        { type: ITEM_TYPE.EMPTY_STATE },
      ];
    }

    if (card) {
      items.push({ type: ITEM_TYPE.CARD_HEADER });
    }

    groupSectionsByDate(filteredFeedList).forEach(({ data, ...section }) => {
      items.push({ type: ITEM_TYPE.SECTION, section });
      items.push(...data.map((item) => ({ type: ITEM_TYPE.ITEM, item })));
    });

    return items;
  };

  getEmptyStateData = () => {
    const {
      tabs = [],
      activeTab,
      emptyState,
    } = this.props;

    let emptyStateData = emptyState || {};
    if (tabs.length) {
      const activeTabInfo = tabs.find(({ id }) => id === activeTab);
      if (activeTabInfo) ({ emptyState: emptyStateData = {} } = activeTabInfo);
    }
    return emptyStateData;
  }

  shouldComponentUpdate(nextProps: Props) {
    return !isEqual(this.props, nextProps);
  }

  selectEvent = (eventData: Object, itemData: Object) => {
    if (!shouldShowEventDetails(eventData)) return;

    Modal.open(() => (
      <EventDetails
        event={eventData}
        itemData={itemData}
        navigation={this.props.navigation}
        isForAllAccounts={this.props.isForAllAccounts}
      />
    ));
  };

  shouldRenderActivityItem = (item: Object) => {
    const typesThatRender = [
      EVENT_TYPE.WALLET_CREATED,
      EVENT_TYPE.WALLET_BACKED_UP,
      TRANSACTION_EVENT,
      COLLECTIBLE_TRANSACTION,
    ];
    return typesThatRender.includes(item.type);
  };

  renderActivityFeedItem = ({ item }) => {
    const {
      isPPNView,
      isForAllAccounts,
      isAssetView,
      card,
      cardHeaderTitle,
    } = this.props;
    switch (item.type) {
      case ITEM_TYPE.HEADER:
      case ITEM_TYPE.TABS:
        return item.component;
      case ITEM_TYPE.EMPTY_STATE:
        const emptyStateData = this.getEmptyStateData();
        return (
          <EmptyStateWrapper>
            <EmptyStateParagraph {...emptyStateData} />
          </EmptyStateWrapper>
        );
      case ITEM_TYPE.SECTION:
        return (
          <CardBackgroundWrapper card={card}>
            <SectionHeaderWrapper>
              <SectionHeader>{item.section.title}</SectionHeader>
            </SectionHeaderWrapper>
          </CardBackgroundWrapper>
        );
      case ITEM_TYPE.CARD_HEADER:
        return (
          <CardHeaderWrapper>
            <MediumText big>{cardHeaderTitle}</MediumText>
          </CardHeaderWrapper>
        );
      default:
        return (
          <CardBackgroundWrapper card={card}>
            <ActivityFeedItem
              event={item.item}
              selectEvent={this.selectEvent}
              isPPNView={isPPNView}
              isAssetView={isAssetView}
              isForAllAccounts={isForAllAccounts}
            />
          </CardBackgroundWrapper>
        );
    }
  };

  getActivityFeedListKeyExtractor = (item: Object = {}) => {
    switch (item.type) {
      case ITEM_TYPE.HEADER:
      case ITEM_TYPE.TABS:
      case ITEM_TYPE.EMPTY_STATE:
      case ITEM_TYPE.CARD_HEADER:
        return item.type;
      case ITEM_TYPE.SECTION:
        return item.section.title;
      default:
        const { createdAt = '' } = item.item;
        return `${createdAt.toString()}${item.item.id || item.item._id || item.item.hash || ''}${item.item.from || ''}`;
    }
  };

  render() {
    const {
      feedTitle,
      wrapperStyle,
      contentContainerStyle,
      initialNumToRender,
      tabs = [],
      activeTab,
      extraFeedData,
      hideTabs,
      feedData,
      headerComponent,
      tabsComponent,
      flatListProps,
      card,
    } = this.props;

    const formattedFeedData = this.generateFeedSections(
      tabs, activeTab, feedData, headerComponent, tabsComponent, card,
    );

    const firstTab = tabs.length ? tabs[0].id : '';

    const additionalContentContainerStyle = !formattedFeedData.length
      ? { justifyContent: 'center', flex: 1 }
      : {};

    const tabsProps = tabs.map(({ data, emptyState, ...necessaryTabProps }) => necessaryTabProps);

    return (
      <ActivityFeedWrapper style={wrapperStyle}>
        {!!feedTitle &&
        <ActivityFeedHeader>
          <Title subtitle title={feedTitle} noMargin />
        </ActivityFeedHeader>}
        {tabs.length > 1 && !hideTabs &&
          <Tabs
            tabs={tabsProps}
            wrapperStyle={{ paddingTop: 0 }}
            activeTab={activeTab || firstTab}
          />
        }
        <ActivityFeedList
          data={formattedFeedData}
          initialNumToRender={initialNumToRender}
          extraData={extraFeedData}
          renderItem={this.renderActivityFeedItem}
          onEndReachedThreshold={0.5}
          keyExtractor={this.getActivityFeedListKeyExtractor}
          contentContainerStyle={[additionalContentContainerStyle, contentContainerStyle]}
          stickyHeaderIndices={[1]}
          {...flatListProps}
        />
      </ActivityFeedWrapper>
    );
  }
}

export default withTheme(ActivityFeed);
