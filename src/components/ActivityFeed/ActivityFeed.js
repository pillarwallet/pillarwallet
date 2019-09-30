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
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { SDK_PROVIDER } from 'react-native-dotenv';

// models
import type { Transaction } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import type { ContactSmartAddressData, ApiUser } from 'models/Contacts';

// components
import SlideModal from 'components/Modals/SlideModal';
import Title from 'components/Title';
import EventDetails from 'components/EventDetails';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Tabs from 'components/Tabs';
import TankAssetBalance from 'components/TankAssetBalance';
import { BaseText } from 'components/Typography';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { SettlementItem } from 'components/ActivityFeed/SettlementItem';

// utils
import { createAlert } from 'utils/alerts';
import { addressesEqual } from 'utils/assets';
import {
  partial,
  formatAmount,
  formatUnits,
  groupAndSortByDate,
} from 'utils/common';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { findMatchingContact } from 'utils/contacts';

// constants
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TRANSACTION_EVENT, CONNECTION_EVENT } from 'constants/historyConstants';
import { CONTACT } from 'constants/navigationConstants';
import { CHAT } from 'constants/chatConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';

const ActivityFeedList = styled.SectionList`
  width: 100%;
  flex: 1;
`;

const ActivityFeedWrapper = styled.View`
  background-color: ${props => props.color ? props.color : baseColors.white};
  flex: 1;
`;

const ActivityFeedHeader = styled.View`
  padding: 0 ${spacing.mediumLarge}px;
  border-top-width: ${props => props.noBorder ? 0 : '1px'};
  border-top-color: ${baseColors.mediumLightGray};
`;

const SectionHeaderWrapper = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px;
`;

const SectionHeader = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.darkGray};
`;

const EmptyStateWrapper = styled.View`
  padding: 15px 30px 30px;
  width: 100%;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

type EmptyState = {
  title?: string,
  textBody?: string,
}

type Tab = {
  id: string,
  name: string,
  icon?: string,
  onPress: Function,
  unread?: number,
  tabImageNormal?: string,
  tabImageActive?: string,
  data: Object[],
  emptyState?: EmptyState,
}

type Props = {
  activeAccountAddress: string,
  assets: Asset[],
  onAcceptInvitation: Function,
  onCancelInvitation: Function,
  onRejectInvitation: Function,
  navigation: NavigationScreenProp<*>,
  esData?: Object,
  contacts: ApiUser[],
  feedTitle?: string,
  backgroundColor?: string,
  wrapperStyle?: Object,
  showArrowsOnly?: boolean,
  noBorder?: boolean,
  invertAddon?: boolean,
  contentContainerStyle?: Object,
  initialNumToRender: number,
  tabs?: Tab[],
  activeTab?: string,
  feedData?: Object[],
  extraFeedData?: Object[],
  esComponent?: React.Node,
  hideTabs: boolean,
  asset?: string,
  feedType?: string,
  contactsSmartAddresses: ContactSmartAddressData[],
  emptyState?: EmptyState,
}

type FeedItemTransaction = {
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
}

type FeedItemConnection = {
  id: string,
  ethAddress: string,
  username: string,
  profileImage: ?string,
  createdAt: string,
  updatedAt: string,
  status: string,
  type: string,
}

type FeedSection = {
  title: string,
  date: string,
  data: Array<FeedItemTransaction | FeedItemConnection>,
}

type State = {
  showModal: boolean,
  selectedEventData: ?Object | ?Transaction,
  eventType: string,
  eventStatus: string,
  tabIsChanging: boolean,
  formattedFeedData: FeedSection[],
  emptyStateData: EmptyState,
}

const PPNIcon = require('assets/icons/icon_PPN.png');

class ActivityFeed extends React.Component<Props, State> {
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

  navigateToChat = (contact) => {
    const { navigation } = this.props;
    navigation.navigate(CHAT, { username: contact.username });
  };

  getRightLabel = (type: string) => {
    switch (type) {
      case TYPE_ACCEPTED:
        return 'Connected';
      case TYPE_SENT:
        return 'Requested';
      case CHAT:
        return 'Read';
      default:
        return null;
    }
  };

  renderActivityFeedItem = ({ item: notification }: Object) => {
    const { type, status: notificationStatus } = notification;
    const {
      activeAccountAddress,
      navigation,
      assets,
      contacts,
      onAcceptInvitation,
      onRejectInvitation,
      showArrowsOnly,
      invertAddon,
      feedType,
      asset,
      contactsSmartAddresses,
    } = this.props;

    const navigateToContact = partial(navigation.navigate, CONTACT, { contact: notification });
    const itemStatusIcon = notificationStatus === 'pending' ? 'pending' : '';

    if (type === TRANSACTION_EVENT) {
      const isReceived = addressesEqual(notification.to, activeAccountAddress);
      const address = isReceived ? notification.from : notification.to;
      const {
        decimals = 18,
        iconUrl,
      } = assets.find(({ symbol }) => symbol === notification.asset) || {};
      const value = formatUnits(notification.value, decimals);
      const formattedValue = formatAmount(value);
      let nameOrAddress = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      let directionIcon = isReceived ? 'received' : 'sent';
      let directionSymbol = isReceived ? '' : '-';

      if (formattedValue === '0') {
        directionSymbol = '';
      }

      const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

      const contact = findMatchingContact(address, contacts, contactsSmartAddresses) || {};
      const isContact = Object.keys(contact).length !== 0;
      const itemImage = contact.profileImage || fullIconUrl;
      let itemValue = `${directionSymbol} ${formattedValue} ${notification.asset}`;
      let customAddon = null;
      let itemImageSource = '';
      let rightColumnInnerStyle = {};
      let customAddonAlignLeft = false;

      const tag = get(notification, 'tag', '');
      if (tag === PAYMENT_NETWORK_TX_SETTLEMENT) {
        return (
          <SettlementItem
            settleData={notification.extra}
            onPress={() => this.selectEvent({ ...notification, value, contact }, type, notificationStatus)}
            type={feedType}
            asset={asset}
            isPending={notificationStatus === 'pending'}
          />
        );
      } else if (tag === PAYMENT_NETWORK_ACCOUNT_TOPUP) {
        nameOrAddress = 'PLR Network Top Up';
        itemImageSource = PPNIcon;
        directionIcon = '';
      } else if (tag === PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL) {
        nameOrAddress = 'PLR Network Withdrawal';
        itemImageSource = PPNIcon;
        directionIcon = '';
      }

      // centers line right addons side vertically if status is present
      if (!isEmpty(itemStatusIcon)) {
        rightColumnInnerStyle = { ...rightColumnInnerStyle, alignItems: 'center' };
      }

      const isPPNTransaction = get(notification, 'isPPNTransaction', false);
      if (isPPNTransaction) {
        if (addressesEqual(notification.to, notification.from)) {
          nameOrAddress = 'Transfer to own account';
        }
        itemValue = '';
        customAddonAlignLeft = true;
        customAddon = (<TankAssetBalance
          amount={`${directionSymbol} ${formattedValue} ${notification.asset}`}
          textStyle={!isReceived ? { color: baseColors.scarlet } : null}
          monoColor
        />);
        rightColumnInnerStyle = { ...rightColumnInnerStyle, flexDirection: 'row' };
      }

      return (
        <ListItemWithImage
          onPress={() => this.selectEvent({ ...notification, value, contact }, type, notificationStatus)}
          label={nameOrAddress}
          avatarUrl={itemImage}
          navigateToProfile={isContact ? navigateToContact : null}
          iconName={showArrowsOnly || !(itemImage || itemImageSource) ? directionIcon : ''}
          itemValue={itemValue}
          itemStatusIcon={itemStatusIcon}
          rightColumnInnerStyle={rightColumnInnerStyle}
          customAddonAlignLeft={customAddonAlignLeft}
          valueColor={isReceived ? baseColors.jadeGreen : baseColors.scarlet}
          imageUpdateTimeStamp={contact.lastUpdateTime || 0}
          customAddon={customAddon}
          itemImageSource={itemImageSource}
          noImageBorder
        />
      );
    }

    if (type === COLLECTIBLE_TRANSACTION) {
      const isReceived = addressesEqual(notification.to, activeAccountAddress);
      const address = isReceived ? notification.from : notification.to;
      const nameOrAddress = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      const directionIcon = isReceived ? 'Received' : 'Sent';

      const contact = contacts.find(({ ethAddress }) => addressesEqual(address, ethAddress)) || {};
      return (
        <ListItemWithImage
          onPress={() => this.selectEvent({ ...notification, contact }, type, notificationStatus)}
          label={nameOrAddress}
          navigateToProfile={Object.keys(contact).length !== 0 ? navigateToContact : () => {}}
          avatarUrl={notification.icon}
          imageAddonUrl={contact.profileImage}
          imageAddonName={nameOrAddress}
          imageAddonIconName={(Object.keys(contact).length === 0 || showArrowsOnly) && !invertAddon
            ? directionIcon.toLowerCase()
            : undefined}
          iconName={invertAddon ? directionIcon.toLowerCase() : null}
          itemStatusIcon={itemStatusIcon}
          actionLabel={directionIcon}
          actionLabelColor={isReceived ? baseColors.jadeGreen : null}
        />
      );
    }

    let onItemPress;
    if (type === TYPE_ACCEPTED || type === TYPE_RECEIVED || type === TYPE_SENT) {
      onItemPress = () => this.selectEvent(notification, CONNECTION_EVENT, type);
    } else if (type === CHAT) {
      onItemPress = partial(this.navigateToChat, {
        username: notification.username,
        profileImage: notification.avatar,
      });
    }

    return (
      <ListItemWithImage
        onPress={onItemPress}
        label={notification.username}
        avatarUrl={notification.profileImage}
        navigateToProfile={navigateToContact}
        rejectInvitation={notification.type === TYPE_RECEIVED
          ? () => createAlert(TYPE_REJECTED, notification, () => onRejectInvitation(notification))
          : null
        }
        acceptInvitation={notification.type === TYPE_RECEIVED
          ? () => onAcceptInvitation(notification)
          : null
        }
        actionLabel={this.getRightLabel(notification.type)}
        labelAsButton={notification.type === TYPE_SENT}
        imageUpdateTimeStamp={notification.lastUpdateTime}
      />
    );
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
      backgroundColor,
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
    } = this.state;

    const additionalContentContainerStyle = !formattedFeedData.length
      ? { justifyContent: 'center', flex: 1 }
      : {};

    const tabsProps = tabs.map(({ data, emptyState, ...necessaryTabProps }) => necessaryTabProps);

    return (
      <ActivityFeedWrapper color={backgroundColor} style={wrapperStyle}>
        {!!feedTitle &&
        <ActivityFeedHeader noBorder={noBorder}>
          <Title subtitle title={feedTitle} />
        </ActivityFeedHeader>}
        {tabs.length > 1 && !hideTabs &&
          <Tabs
            initialActiveTab={activeTab}
            tabs={tabsProps}
            wrapperStyle={{ paddingTop: 0 }}
            onTabChange={this.onTabChange}
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
          maxToRenderPerBatch={initialNumToRender}
          onEndReachedThreshold={0.5}
          keyExtractor={this.getActivityFeedListKeyExtractor}
          contentContainerStyle={[additionalContentContainerStyle, contentContainerStyle]}
          removeClippedSubviews
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
          />
        </SlideModal>
        }
      </ActivityFeedWrapper>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
}) => ({
  contacts,
  contactsSmartAddresses,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: (state) => Object.values(accountAssetsSelector(state)),
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(ActivityFeed);
