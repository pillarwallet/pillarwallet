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
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';

// types
import type { Transaction } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';

// components
import SlideModal from 'components/Modals/SlideModal';
import Title from 'components/Title';
import EventDetails from 'components/EventDetails';
import Tabs from 'components/Tabs';
import { BaseText } from 'components/Typography';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ActivityFeedItem from 'components/ActivityFeed/ActivityFeedItem';

// utils
import { groupAndSortByDate } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { getAssetsAsList } from 'utils/assets';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

const ActivityFeedList = styled.SectionList`
  width: 100%;
  flex: 1;
`;

const ActivityFeedWrapper = styled.View`
  flex: 1;
`;

const ActivityFeedHeader = styled.View`
  padding: ${spacing.mediumLarge}px ${spacing.large}px 0;
  border-top-width: ${props => props.noBorder ? 0 : '1px'};
  border-top-color: ${themedColors.border};
`;

const SectionHeaderWrapper = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px;
`;

const SectionHeader = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
`;

const EmptyStateWrapper = styled.View`
  padding: 15px 30px 30px;
  width: 100%;
  flex: 1;
  align-items: center;
  justify-content: center;
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
  onAcceptInvitation: Function,
  onCancelInvitation: Function,
  onRejectInvitation: Function,
  navigation: NavigationScreenProp<*>,
  feedTitle?: string,
  wrapperStyle?: Object,
  noBorder?: boolean,
  contentContainerStyle?: Object,
  initialNumToRender: number,
  tabs?: Tab[],
  activeTab?: string,
  feedData?: Object[],
  extraFeedData?: Object[],
  hideTabs: boolean,
  emptyState?: EmptyState,
  ensRegistry: EnsRegistry,
};

type FeedItemTransaction = {|
  username?: string,
  to: string,
  from: string,
  hash: string,
  createdAt: string,
  pillarId: string,
  protocol: string,
  contractAddress: ?string,
  blockNumber: number,
  value: number,
  status: string,
  gasPrice: ?number,
  gasUsed: number,
  tranType: ?string,
  tokenId?: string,
  _id: string,
  type: string,
|};

type FeedItemConnection = {|
  id: string,
  ethAddress: string,
  username: string,
  profileImage: ?string,
  createdAt: string,
  updatedAt: string,
  status: string,
  type: string,
|};

type FeedSection = {|
  title: string,
  date: string,
  data: Array<FeedItemTransaction | FeedItemConnection>,
|};

type State = {|
  showModal: boolean,
  selectedEventData: ?Object | ?Transaction,
  eventType: string,
  eventStatus: string,
  tabIsChanging: boolean,
  formattedFeedData: FeedSection[],
  emptyStateData: EmptyState | {},
  scrollOffset: ?number,
  maxScrollOffset: ?number,
|};

class ActivityFeed extends React.Component<Props, State> {
  eventDetailScrollViewRef: ?Object;

  static defaultProps = {
    initialNumToRender: 7,
  };

  state = {
    showModal: false,
    selectedEventData: null,
    eventType: '',
    eventStatus: '',
    tabIsChanging: false,
    formattedFeedData: [],
    emptyStateData: {},
    scrollOffset: undefined,
    maxScrollOffset: undefined,
  };

  componentDidMount() {
    this.generateFeedSections();
  }

  componentDidUpdate(prevProps: Props) {
    const { tabs = [], feedData = [] } = this.props;
    if ((tabs.length && !isEqual(tabs, prevProps.tabs))
      || (feedData.length && !isEqual(feedData, prevProps.feedData))) {
      this.generateFeedSections();
    }
  }

  generateFeedSections = () => {
    const {
      tabs = [],
      activeTab,
      feedData = [],
      emptyState,
    } = this.props;
    let feedList = feedData;
    let emptyStateData = emptyState || {};

    if (tabs.length) {
      const activeTabInfo = tabs.find(({ id }) => id === activeTab);
      if (activeTabInfo) ({ data: feedList, emptyState: emptyStateData = {} } = activeTabInfo);
    }

    const dataSections = groupAndSortByDate(feedList);

    this.setState({ formattedFeedData: dataSections, emptyStateData });
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  selectEvent = (eventData: Object, eventType, eventStatus) => {
    this.setState({
      eventType,
      eventStatus,
      selectedEventData: eventData,
      showModal: true,
    });
  };

  renderActivityFeedItem = ({ item: notification }: Object) => {
    return <ActivityFeedItem event={notification} selectEvent={this.selectEvent} />;
  };

  handleRejectInvitation = () => {
    this.props.onRejectInvitation(this.state.selectedEventData);
  };

  handleCancelInvitation = () => {
    this.props.onCancelInvitation(this.state.selectedEventData);
  };

  handleAcceptInvitation = () => {
    this.props.onAcceptInvitation(this.state.selectedEventData);
  };

  handleClose = () => {
    this.setState({ showModal: false });
  };

  getActivityFeedListKeyExtractor = (item: Object = {}) => {
    const { createdAt = '' } = item;
    return `${createdAt.toString()}${item.id || item._id || item.hash || ''}`;
  };

  onTabChange = (isChanging?: boolean) => {
    this.setState({ tabIsChanging: isChanging });
  };

  render() {
    const {
      feedTitle,
      navigation,
      wrapperStyle,
      noBorder,
      contentContainerStyle,
      initialNumToRender,
      tabs = [],
      activeTab,
      extraFeedData,
      hideTabs,
    } = this.props;

    const {
      showModal,
      selectedEventData,
      eventType,
      eventStatus,
      tabIsChanging,
      formattedFeedData,
      emptyStateData,
      scrollOffset,
      maxScrollOffset,
    } = this.state;

    const firstTab = tabs.length ? tabs[0].id : '';

    const additionalContentContainerStyle = !formattedFeedData.length
      ? { justifyContent: 'center', flex: 1 }
      : {};

    const tabsProps = tabs.map(({ data, emptyState, ...necessaryTabProps }) => necessaryTabProps);

    return (
      <ActivityFeedWrapper style={wrapperStyle}>
        {!!feedTitle &&
        <ActivityFeedHeader noBorder={noBorder}>
          <Title subtitle title={feedTitle} noMargin />
        </ActivityFeedHeader>}
        {tabs.length > 1 && !hideTabs &&
          <Tabs
            tabs={tabsProps}
            wrapperStyle={{ paddingTop: 0 }}
            onTabChange={this.onTabChange}
            activeTab={activeTab || firstTab}
          />
        }
        {!tabIsChanging &&
        <ActivityFeedList
          sections={formattedFeedData}
          initialNumToRender={initialNumToRender}
          extraData={extraFeedData}
          renderSectionHeader={({ section }) => (
            <SectionHeaderWrapper>
              <SectionHeader>{section.title}</SectionHeader>
            </SectionHeaderWrapper>
          )}
          renderItem={this.renderActivityFeedItem}
          getItemLayout={(data, index) => ({
            length: 70,
            offset: 70 * index,
            index,
          })}
          onEndReachedThreshold={0.5}
          keyExtractor={this.getActivityFeedListKeyExtractor}
          contentContainerStyle={[additionalContentContainerStyle, contentContainerStyle]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={(
            <EmptyStateWrapper>
              <EmptyStateParagraph {...emptyStateData} />
            </EmptyStateWrapper>
          )}
        />}
        {!!selectedEventData &&
        <SlideModal
          isVisible={showModal}
          title="transaction details"
          onModalHide={this.handleClose}
          eventDetail
          handleScrollTo={({ y }) => {
            if (this.eventDetailScrollViewRef && y) {
              this.eventDetailScrollViewRef.scrollTo({ x: 0, y, animated: false });
            }
          }}
          scrollOffset={scrollOffset}
          scrollOffsetMax={maxScrollOffset}
          onSwipeComplete={this.handleClose}
        >
          <EventDetails
            eventData={selectedEventData}
            eventType={eventType}
            eventStatus={eventStatus}
            onClose={this.handleClose}
            onReject={this.handleRejectInvitation}
            onCancel={this.handleCancelInvitation}
            onAccept={this.handleAcceptInvitation}
            navigation={navigation}
            getRef={(ref) => { this.eventDetailScrollViewRef = ref; }}
            getScrollOffset={(offset) => this.setState({ scrollOffset: offset })}
            getMaxScrollOffset={(maxOffset) => this.setState({ maxScrollOffset: maxOffset })}
          />
        </SlideModal>
        }
      </ActivityFeedWrapper>
    );
  }
}

const structuredSelector = createStructuredSelector({
  assets: (state) => getAssetsAsList(accountAssetsSelector(state)),
});

const combinedMapStateToProps = (state: RootReducerState) => ({
  ...structuredSelector(state),
});

export default withTheme(connect(combinedMapStateToProps)(ActivityFeed));
