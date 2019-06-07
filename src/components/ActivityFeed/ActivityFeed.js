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
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { format as formatDate } from 'date-fns';
import { BigNumber } from 'bignumber.js';

import { baseColors, spacing } from 'utils/variables';
import type { Notification } from 'models/Notification';
import type { Transaction } from 'models/Transaction';
import type { Asset } from 'models/Asset';

import EmptyTransactions from 'components/EmptyState/EmptyTransactions';
import Separator from 'components/Separator';
import SlideModal from 'components/Modals/SlideModal';
import Title from 'components/Title';
import EventDetails from 'components/EventDetails';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';

import { getUserName } from 'utils/contacts';
import { partial, uniqBy, formatAmount } from 'utils/common';
import { createAlert } from 'utils/alerts';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TRANSACTIONS, SOCIAL } from 'constants/activityConstants';
import { TRANSACTION_EVENT, CONNECTION_EVENT } from 'constants/historyConstants';
import { CONTACT } from 'constants/navigationConstants';
import { CHAT } from 'constants/chatConstants';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

const SOCIAL_TYPES = [
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
  CHAT,
];

const ActivityFeedList = styled.FlatList`
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

type Props = {
  history: Array<*>,
  assets: Asset[],
  onAcceptInvitation: Function,
  onCancelInvitation: Function,
  onRejectInvitation: Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  notifications: Notification[],
  activeTab: string,
  esData: Object,
  resetUnread: Function,
  customFeedData?: Object,
  contacts: Object,
  invitations: Object,
  additionalFiltering?: Function,
  feedTitle?: string,
  backgroundColor?: string,
  wrapperStyle?: Object,
  showArrowsOnly?: boolean,
  noBorder?: boolean,
  openSeaTxHistory: Object[],
  invertAddon?: boolean,
  fetchAllCollectiblesData: Function,
  contentContainerStyle?: Object,
  initialNumToRender: number,
  getFeedLength?: Function,
  esComponent?: React.Node,
};

type State = {
  showModal: boolean,
  selectedEventData: ?Object | ?Transaction,
  eventType: string,
  eventStatus: string,
};

class ActivityFeed extends React.Component<Props, State> {
  feedData: Object[];

  static defaultProps = {
    initialNumToRender: 7,
  };

  constructor(props: Props) {
    super(props);
    this.feedData = [];
    this.state = {
      showModal: false,
      selectedEventData: null,
      eventType: '',
      eventStatus: '',
    };
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  componentDidMount() {
    const { getFeedLength } = this.props;
    if (getFeedLength) getFeedLength(this.feedData.length);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      notifications,
      contacts,
      invitations,
      history,
      customFeedData,
      openSeaTxHistory,
      esData,
      getFeedLength,
    } = this.props;

    if (getFeedLength && (prevProps.notifications !== notifications ||
      prevProps.contacts !== contacts ||
      prevProps.invitations !== invitations ||
      prevProps.history !== history ||
      prevProps.customFeedData !== customFeedData ||
      prevProps.openSeaTxHistory !== openSeaTxHistory ||
      prevProps.esData !== esData)) {
      getFeedLength(this.feedData.length);
    }
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

  mapTransactionsHistory(history, contacts, eventType) {
    const concatedHistory = history
      .map(({ ...rest }) => ({ ...rest, type: eventType }))
      .map(({ to, from, ...rest }) => {
        const contact = contacts.find(({ ethAddress }) => {
          return from.toUpperCase() === ethAddress.toUpperCase()
            || to.toUpperCase() === ethAddress.toUpperCase();
        });

        return {
          username: getUserName(contact),
          to,
          from,
          ...rest,
        };
      });
    return uniqBy(concatedHistory, 'hash');
  }

  mapOpenSeaAndBCXTransactionsHistory(openSeaHistory, BCXHistory) {
    const concatedCollectiblesHistory = openSeaHistory
      .map(({ hash, ...rest }) => {
        const historyEntry = BCXHistory.find(({ hash: bcxHash }) => {
          return hash.toUpperCase() === bcxHash.toUpperCase();
        });

        return {
          hash,
          ...rest,
          ...historyEntry,
        };
      });
    return uniqBy(concatedCollectiblesHistory, 'hash');
  }

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
    const { type } = notification;
    const {
      wallet,
      navigation,
      assets,
      contacts,
      onAcceptInvitation,
      onRejectInvitation,
      showArrowsOnly,
      invertAddon,
    } = this.props;

    const walletAddress = wallet.address;
    const dateTime = formatDate(new Date(notification.createdAt * 1000), 'MMM D');
    const navigateToContact = partial(navigation.navigate, CONTACT, { contact: notification });

    if (type === TRANSACTION_EVENT) {
      const isReceived = notification.to.toUpperCase() === walletAddress.toUpperCase();
      const address = isReceived ? notification.from : notification.to;
      const { decimals = 18 } = assets.find(({ symbol }) => symbol === notification.asset) || {};
      const value = utils.formatUnits(new BigNumber(notification.value.toString()).toFixed(), decimals);
      const formattedValue = formatAmount(value);
      const nameOrAddress = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      const directionIcon = isReceived ? 'received' : 'sent';
      let directionSymbol = isReceived ? '+' : '-';

      if (formattedValue === '0') {
        directionSymbol = '';
      }

      const contact = contacts
        .find(({ ethAddress }) => address.toUpperCase() === ethAddress.toUpperCase()) || {};

      return (
        <ListItemWithImage
          onPress={() => this.selectEvent({ ...notification, value, contact }, type, notification.status)}
          label={nameOrAddress}
          avatarUrl={contact.profileImage}
          navigateToProfile={Object.keys(contact).length !== 0 ? navigateToContact : null}
          iconName={Object.keys(contact).length === 0 || showArrowsOnly ? directionIcon : null}
          subtext={dateTime}
          itemValue={`${directionSymbol} ${formattedValue} ${notification.asset}`}
          itemStatusIcon={notification.status === 'pending' ? 'pending' : ''}
          valueColor={isReceived ? baseColors.jadeGreen : null}
          imageUpdateTimeStamp={contact.lastUpdateTime}
        />
      );
    }

    if (type === COLLECTIBLE_TRANSACTION) {
      const isReceived = notification.to.toUpperCase() === walletAddress.toUpperCase();
      const address = isReceived ? notification.from : notification.to;
      const nameOrAddress = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      const directionIcon = isReceived ? 'Received' : 'Sent';

      const contact = contacts
        .find(({ ethAddress }) => address.toUpperCase() === ethAddress.toUpperCase()) || {};
      return (
        <ListItemWithImage
          onPress={() => this.selectEvent({ ...notification, contact }, type, notification.status)}
          label={nameOrAddress}
          navigateToProfile={Object.keys(contact).length !== 0 ? navigateToContact : () => {}}
          avatarUrl={notification.icon}
          imageAddonUrl={contact.profileImage}
          imageAddonName={nameOrAddress}
          imageAddonIconName={(Object.keys(contact).length === 0 || showArrowsOnly) && !invertAddon
            ? directionIcon.toLowerCase()
            : undefined}
          iconName={invertAddon ? directionIcon.toLowerCase() : null}
          subtext={dateTime}
          itemValue={directionIcon}
          itemStatusIcon={notification.status === 'pending' ? 'pending' : ''}
          valueColor={isReceived ? baseColors.jadeGreen : null}
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
        subtext={dateTime}
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

  render() {
    const {
      notifications,
      contacts,
      invitations,
      history,
      additionalFiltering,
      customFeedData,
      feedTitle,
      navigation,
      backgroundColor,
      wrapperStyle,
      noBorder,
      openSeaTxHistory,
      contentContainerStyle,
      initialNumToRender,
      activeTab,
      esData,
      esComponent,
    } = this.props;

    const {
      showModal,
      selectedEventData,
      eventType,
      eventStatus,
    } = this.state;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    // extending OpenSea transaction data with BCX data
    const collectiblesHistory =
      this.mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);

    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));
    const mappedHistory = this.mapTransactionsHistory(tokenTxHistory, mappedContacts, TRANSACTION_EVENT);
    const mappedCollectiblesHistory =
      this.mapTransactionsHistory(collectiblesHistory, mappedContacts, COLLECTIBLE_TRANSACTION);
    const chatNotifications = [];
    /* chats.chats
      .map((
        {
          username,
          lastMessage,
        }) => {
        if (lastMessage.savedTimestamp === '') return {};
        return {
          content: lastMessage.content,
          username,
          type: 'CHAT',
          createdAt: lastMessage.savedTimestamp,
        };
      }); */
    const allFeedData = [
      ...mappedContacts,
      ...invitations,
      ...mappedHistory,
      ...chatNotifications,
      ...mappedCollectiblesHistory]
      .filter(value => Object.keys(value).length !== 0)
      .sort((a, b) => b.createdAt - a.createdAt);

    const feedData = customFeedData || allFeedData;

    const filteredHistory = feedData.filter(({ type }) => {
      if (activeTab === TRANSACTIONS) {
        return type === TRANSACTION_EVENT || type === COLLECTIBLE_TRANSACTION;
      }
      if (activeTab === SOCIAL) {
        return SOCIAL_TYPES.includes(type);
      }
      return true;
    });

    this.feedData = additionalFiltering ? additionalFiltering(filteredHistory) : filteredHistory;

    if (this.feedData.length < 1 && !(esData || esComponent)) {
      return null;
    }

    const additionalContentContainerStyle = !this.feedData.length
      ? { justifyContent: 'center', flex: 1 }
      : {};

    return (
      <ActivityFeedWrapper color={backgroundColor} style={wrapperStyle}>
        {!!feedTitle &&
        <ActivityFeedHeader noBorder={noBorder}>
          <Title subtitle title={feedTitle} />
        </ActivityFeedHeader>}
        <ActivityFeedList
          data={this.feedData}
          initialNumToRender={initialNumToRender}
          extraData={notifications}
          renderItem={this.renderActivityFeedItem}
          getItemLayout={(data, index) => ({
            length: 70,
            offset: 70 * index,
            index,
          })}
          maxToRenderPerBatch={initialNumToRender}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={80} />}
          keyExtractor={this.getActivityFeedListKeyExtractor}
          ListEmptyComponent={esComponent
          || <EmptyTransactions title={esData && esData.title} bodyText={esData && esData.body} />}
          contentContainerStyle={[additionalContentContainerStyle, contentContainerStyle]}
        />
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
      </ActivityFeedWrapper>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  notifications: { data: notifications },
  history: { data: history },
  invitations: { data: invitations },
  assets: { data: assets },
  wallet: { data: wallet },
  collectibles: { transactionHistory: openSeaTxHistory },
}) => ({
  contacts,
  notifications,
  history,
  invitations,
  assets: Object.values(assets),
  wallet,
  openSeaTxHistory,
});

const mapDispatchToProps = (dispatch) => ({
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ActivityFeed);
