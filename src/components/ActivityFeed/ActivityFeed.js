// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { Platform } from 'react-native';
import { format as formatDate } from 'date-fns';
import { BigNumber } from 'bignumber.js';

import { resetUnreadAction } from 'actions/chatActions';
import { fontSizes, baseColors, spacing, UIColors, fontWeights } from 'utils/variables';
import type { Notification } from 'models/Notification';
import type { Transaction } from 'models/Transaction';
import type { Asset } from 'models/Asset';

import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import { BaseText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import EmptyTransactions from 'components/EmptyState/EmptyTransactions';
import Separator from 'components/Separator';
import SlideModal from 'components/Modals/SlideModal';
import Title from 'components/Title';
import EventDetails from 'components/EventDetails';

import { getUserName } from 'utils/contacts';
import { partial, uniqBy, formatAmount } from 'utils/common';
import { createAlert } from 'utils/alerts';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { TRANSACTIONS, SOCIAL } from 'constants/activityConstants';
import { TRANSACTION_EVENT, CONNECTION_EVENT } from 'constants/historyConstants';
import { CONTACT } from 'constants/navigationConstants';
import { CHAT } from 'constants/chatConstants';

const TRANSACTION_RECEIVED = 'TRANSACTION_RECEIVED';
const TRANSACTION_SENT = 'TRANSACTION_SENT';
const SOCIAL_TYPES = [
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
  CHAT,
];

const NOTIFICATION_LABELS = {
  [TYPE_ACCEPTED]: 'New connection',
  [TYPE_RECEIVED]: 'Incoming connection',
  [TYPE_SENT]: 'Request sent',
  [TYPE_REJECTED]: 'Connection rejected',
  [TRANSACTION_RECEIVED]: 'Received',
  [TRANSACTION_SENT]: 'Sent',
  [CHAT]: 'New message',
};

const ActivityFeedList = styled.FlatList``;
const ActivityFeedWrapper = styled.View``;

const ActivityFeedItem = styled.TouchableOpacity`
  background-color: transparent;
  height: 74px;
  padding: 0px ${spacing.rhythm}px;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
`;

const ActivityFeedDirectionCircle = styled.View`
  width: 40px;
  border-radius: 20px;
  height: 40px;
  background-color: ${baseColors.lightGray};
  align-items: center;
  justify-content: center;
`;

const ActivityFeedDirectionCircleIcon = styled(Icon)`
  color: ${baseColors.offBlue};
  font-size: ${fontSizes.giant};
`;

const ActivityFeedItemLabel = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraExtraSmall};
  margin-bottom: 2px;
`;

const ActivityFeedItemName = styled(BaseText)`
  font-size: ${fontSizes.small};
`;

const ActivityFeedItemAmount = styled(BaseText)`
  font-size: ${fontSizes.medium};
  color: ${props => props.received ? baseColors.jadeGreen : baseColors.slateBlack};
  text-align: right;
`;

const ActivityFeedItemCol = styled.View`
  flex: ${props => props.fixedWidth ? `0 0 ${props.fixedWidth}` : 1};
  flex-direction: column;
  align-items: ${props => props.flexEnd ? 'flex-end' : 'flex-start'};
  justify-content: center;
`;

const ActionCircleButton = styled(IconButton)`
  height: 34px;
  width: 34px;
  border-radius: 17px;
  padding: ${Platform.OS === 'ios' ? 0 : 8}px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;

const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

const LabelText = styled(BaseText)`
  font-size: ${(props) => props.button ? fontSizes.extraSmall : fontSizes.small};
  color: ${(props) => props.button ? baseColors.electricBlue : baseColors.darkGray};
  margin-left: auto;
  padding: ${(props) => props.button ? `0 ${spacing.rhythm}px` : '6px 0'};
  ${props => props.button ? `border-color: ${UIColors.defaultBorderColor};` : ''}
  ${props => props.button ? 'border-width: 1px;' : ''}
  ${props => props.button ? 'border-radius: 40px;' : ''}
  ${props => props.button ? 'height: 34px;' : ''}
  ${props => props.button ? `font-weight: ${fontWeights.medium};` : ''}
`;

const IconWrapper = styled.View`
  align-items: flex-start;
  margin-right: ${spacing.rhythm}px;
`;

const ActivityFeedHeader = styled.View`
  padding: 0 ${spacing.rhythm}px;
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
  showEmptyState?: boolean,
};

type State = {
  showModal: boolean,
  selectedEventData: ?Object | ?Transaction,
  eventType: string,
  eventStatus: string,
};

class ActivityFeed extends React.Component<Props, State> {
  state = {
    showModal: false,
    selectedEventData: null,
    eventType: '',
    eventStatus: '',
  };

  selectEvent = (eventData: Object, eventType, eventStatus) => {
    this.setState({
      eventType,
      eventStatus,
      selectedEventData: eventData,
      showModal: true,
    });
  };

  getSocialAction = (type: string, notification: Object) => {
    const {
      onAcceptInvitation,
      onRejectInvitation,
    } = this.props;

    switch (type) {
      case TYPE_RECEIVED:
        return (
          <ButtonIconWrapper>
            <ActionCircleButton
              color={baseColors.darkGray}
              margin={0}
              icon="close"
              fontSize={fontSizes.extraSmall}
              onPress={() => createAlert(TYPE_REJECTED, notification, () => onRejectInvitation(notification))}
            />
            <ActionCircleButton
              color={baseColors.white}
              margin={0}
              accept
              icon="check"
              fontSize={fontSizes.extraSmall}
              onPress={() => onAcceptInvitation(notification)}
            />
          </ButtonIconWrapper>
        );
      case TYPE_ACCEPTED:
        return (
          <LabelText>
            Accepted
          </LabelText>
        );
      case TYPE_SENT:
        return (
          <LabelText button>
            Request Sent
          </LabelText>
        );
      case CHAT:
        return (
          <LabelText>
            Read
          </LabelText>
        );
      default:
        return (
          <LabelText>
            Dismissed
          </LabelText>
        );
    }
  };

  navigateToChat = (contact) => {
    const { navigation, resetUnread } = this.props;
    navigation.navigate(CHAT, { contact });
    resetUnread(contact.username);
  };

  mapTransactionsHistory(history, contacts) {
    const concatedHistory = history
      .map(({ ...rest }) => ({ type: TRANSACTION_EVENT, ...rest }))
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

  renderActivityFeedItem = ({ item: notification, index }: Object) => {
    const { type } = notification;
    const {
      wallet,
      navigation,
      assets,
      contacts,
    } = this.props;

    const walletAddress = wallet.address;
    const dateTime = formatDate(new Date(notification.createdAt * 1000), 'MMM Do');

    if (type === TRANSACTION_EVENT) {
      const isReceived = notification.to.toUpperCase() === walletAddress.toUpperCase();
      const address = isReceived ? notification.from : notification.to;
      const { decimals = 18 } = assets.find(({ symbol }) => symbol === notification.asset) || {};
      const value = utils.formatUnits(new BigNumber(notification.value.toString()).toFixed(), decimals);
      const formattedValue = formatAmount(value);
      const direction = isReceived ? TRANSACTION_RECEIVED : TRANSACTION_SENT;
      const nameOrAddress = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      const directionIcon = isReceived ? 'received' : 'sent';
      let directionSymbol = isReceived ? '+' : '-';

      if (formattedValue === '0') {
        directionSymbol = '';
      }

      const contact = contacts
        .find(({ ethAddress }) => address.toUpperCase() === ethAddress.toUpperCase()) || {};

      let image;
      if (contact && Object.keys(contact).length !== 0) {
        image = (
          <ProfileImage
            uri={contact.profileImage}
            userName={contact.username}
            diameter={40}
            textStyle={{ fontSize: fontSizes.medium }}
          />
        );
      } else {
        image = (
          <ActivityFeedDirectionCircle>
            <ActivityFeedDirectionCircleIcon name={directionIcon} />
          </ActivityFeedDirectionCircle>
        );
      }

      return (
        <ActivityFeedItem
          key={index}
          onPress={() => this.selectEvent({ ...notification, value }, type, notification.status)}
        >
          <ActivityFeedItemCol fixedWidth="50px">
            <IconWrapper>
              {image}
            </IconWrapper>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol>
            <ActivityFeedItemName>{nameOrAddress}</ActivityFeedItemName>
            <ActivityFeedItemLabel>{NOTIFICATION_LABELS[direction]} · {dateTime}</ActivityFeedItemLabel>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol flexEnd>
            <ActivityFeedItemAmount received={isReceived}>
              {directionSymbol} {formattedValue} {notification.asset}
            </ActivityFeedItemAmount>
          </ActivityFeedItemCol>
        </ActivityFeedItem>
      );
    }

    const navigateToContact = partial(navigation.navigate, CONTACT, { contact: notification });

    let onItemPress;
    if (type === TYPE_ACCEPTED || type === TYPE_RECEIVED || type === TYPE_SENT) {
      onItemPress = () => this.selectEvent(notification, CONNECTION_EVENT, type);
    } else if (type === CHAT) {
      onItemPress = partial(this.navigateToChat, {
        username: notification.username,
        profileImage: notification.avatar,
      });
    }

    const onProfileImagePress = ([TYPE_SENT, TYPE_RECEIVED].includes(type)) ? navigateToContact : undefined;

    return (
      <ActivityFeedItem key={index} onPress={onItemPress} disabled={!onItemPress}>
        <ActivityFeedItemCol fixedWidth="50px">
          <ProfileImage
            uri={notification.profileImage}
            userName={notification.username}
            diameter={36}
            containerStyle={{ marginRight: 10 }}
            textStyle={{ fontSize: 14 }}
            onPress={onProfileImagePress}
          />
        </ActivityFeedItemCol>
        <ActivityFeedItemCol fixedWidth="150px">
          <ActivityFeedItemName>{notification.username}</ActivityFeedItemName>
          <ActivityFeedItemLabel>{NOTIFICATION_LABELS[notification.type]} · {dateTime}</ActivityFeedItemLabel>
        </ActivityFeedItemCol>
        <ActivityFeedItemCol flexEnd>
          {this.getSocialAction(type, notification)}
        </ActivityFeedItemCol>
      </ActivityFeedItem>
    );
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
      onRejectInvitation,
      onAcceptInvitation,
      onCancelInvitation,
    } = this.props;

    const {
      showModal,
      selectedEventData,
      eventType,
      eventStatus,
    } = this.state;

    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));
    const mappedHistory = this.mapTransactionsHistory(history, mappedContacts);
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

    const allFeedData = [...mappedContacts, ...invitations, ...mappedHistory, ...chatNotifications]
      .filter(value => Object.keys(value).length !== 0)
      .sort((a, b) => b.createdAt - a.createdAt);

    const feedData = customFeedData || allFeedData;
    const { activeTab, esData, showEmptyState } = this.props;

    const filteredHistory = feedData.filter(({ type }) => {
      if (activeTab === TRANSACTIONS) {
        return type === TRANSACTION_EVENT;
      }
      if (activeTab === SOCIAL) {
        return SOCIAL_TYPES.includes(type);
      }
      return true;
    });

    const processedHistory = additionalFiltering ? additionalFiltering(filteredHistory) : filteredHistory;

    return (
      <ActivityFeedWrapper>
        {!!feedTitle && (!!processedHistory.length || !!showEmptyState) &&
        <ActivityFeedHeader>
          <Title subtitle title={feedTitle} />
        </ActivityFeedHeader>}
        <ActivityFeedList
          data={processedHistory}
          extraData={notifications}
          renderItem={this.renderActivityFeedItem}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={60} />}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            !!showEmptyState && <EmptyTransactions title={esData && esData.title} bodyText={esData && esData.body} />
          }
        />
        <SlideModal
          isVisible={showModal}
          title="transaction details"
          onModalHide={() => { this.setState({ showModal: false }); }}
          eventDetail
        >
          <EventDetails
            eventData={selectedEventData}
            eventType={eventType}
            eventStatus={eventStatus}
            onClose={() => this.setState({ showModal: false })}
            onReject={() => onRejectInvitation(selectedEventData)}
            onCancel={() => onCancelInvitation(selectedEventData)}
            onAccept={() => onAcceptInvitation(selectedEventData)}
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
}) => ({
  contacts,
  notifications,
  history,
  invitations,
  assets: Object.values(assets),
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ActivityFeed);
