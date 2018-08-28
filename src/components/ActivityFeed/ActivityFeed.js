// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { TouchableOpacity, Platform, View } from 'react-native';
import { format as formatDate } from 'date-fns';
import { BigNumber } from 'bignumber.js';

import { resetUnreadAction } from 'actions/chatActions';
import { UIColors, fontSizes, baseColors, spacing } from 'utils/variables';
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
import TXDetails from 'components/TXDetails';
import Title from 'components/Title';

import { getUserName } from 'utils/contacts';
import { partial, uniqBy } from 'utils/common';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { TRANSACTIONS, SOCIAL, ALL } from 'constants/activityConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
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

const TabWrapper = styled.View`
  padding: 10px 16px 10px;
  background: ${baseColors.white};
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  border-style: solid;
`;

const TabWrapperScrollView = styled.ScrollView`
  flex-direction: row;
`;

const TabItem = styled.TouchableOpacity`
  height: 32px;
  padding: 0 10px;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.active ? baseColors.electricBlue : 'transparent'};
  border-radius: 16px;
  flex-direction: row;
`;

const TabItemIcon = styled(Icon)`
  font-size: ${fontSizes.extraSmall};
  margin-right: 5px;
  color: ${props => props.active ? baseColors.white : baseColors.darkGray};
`;

const TabItemText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  color: ${props => props.active ? baseColors.white : baseColors.darkGray};
`;

const ActivityFeedHeader = styled.View`
  padding: 0 ${spacing.rhythm}px;
`;

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
  font-size: ${fontSizes.extraSmall};
`;

const ActivityFeedItemAmount = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${props => props.received ? baseColors.jadeGreen : baseColors.fireEngineRed};
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
  font-size: ${fontSizes.small};
  color: ${(props) => props.button ? baseColors.fireEngineRed : baseColors.darkGray};
  margin-left: auto;
  padding: 6px;
`;

const IconWrapper = styled.View`
  align-items: flex-start;
  margin-right: ${spacing.rhythm}px;
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
  esTitle: string,
  esBody: string,
  resetUnread: Function,
  feedTitle: string,
  sortable?: boolean,
  customFeedData?: Object,
  contacts: Object,
  invitations: Object,
  historyNotifications: Object,
  additionalFiltering?: Function,
};

type State = {
  showModal: boolean,
  selectedTransaction: ?Transaction,
  activeTab: string,
  esTitle: string,
  esBody: string,
};

class ActivityFeed extends React.Component<Props, State> {
  state = {
    showModal: false,
    selectedTransaction: null,
    activeTab: 'ALL',
    esTitle: 'Make your first step',
    esBody: 'Your activity will appear here.',
  };

  selectTransaction = (transaction: Transaction) => {
    this.setState({
      selectedTransaction: transaction,
      showModal: true,
    });
  };

  getSocialAction = (type: string, notification: Object) => {
    const {
      onCancelInvitation,
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
              onPress={() => onRejectInvitation(notification)}
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
          <TouchableOpacity onPress={() => onCancelInvitation(notification)}>
            <LabelText button>
              Cancel
            </LabelText>
          </TouchableOpacity >
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

  mapTransactionsHistory(history, historyNotifications, contacts) {
    const concatedHistory = history
      .map(({ ...rest }) => ({ type: TRANSACTION_EVENT, ...rest }))
      .concat(historyNotifications.map(({
        toAddress,
        fromAddress,
        txHash,
        ...rest
      }) => ({
        hash: txHash,
        to: toAddress,
        from: fromAddress,
        ...rest,
      })))
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
      const directionSymbol = isReceived ? '+' : '-';
      const { decimals = 18 } = assets.find(({ symbol }) => symbol === notification.asset) || {};
      const value = utils.formatUnits(new BigNumber(notification.value.toString()).toFixed(), decimals);
      const direction = isReceived ? TRANSACTION_RECEIVED : TRANSACTION_SENT;
      const title = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      const directionIcon = isReceived ? 'received' : 'sent';

      const contact = contacts
        .find(({ ethAddress }) => address.toUpperCase() === ethAddress.toUpperCase()) || {};

      const nameOrAddress = contact.firstName ? `${contact.firstName} ${contact.lastName}`.trim() : title;

      let image;
      if (contact) {
        image = (
          <ProfileImage
            uri={contact.profileImage}
            userName={title}
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
        <ActivityFeedItem key={index} onPress={() => this.selectTransaction({ ...notification, value })}>
          <ActivityFeedItemCol fixedWidth="50px">
            <IconWrapper>
              { image }
            </IconWrapper>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol>
            <ActivityFeedItemName>{nameOrAddress}</ActivityFeedItemName>
            <ActivityFeedItemLabel>{NOTIFICATION_LABELS[direction]} · {dateTime}</ActivityFeedItemLabel>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol fixedWidth="120px" flexEnd>
            <ActivityFeedItemAmount received={isReceived}>
              {directionSymbol} {value} {notification.asset}
            </ActivityFeedItemAmount>
          </ActivityFeedItemCol>
        </ActivityFeedItem>
      );
    }

    const navigateToContact = partial(navigation.navigate, CONTACT, { contact: notification });

    let onItemPress;
    if (type === TYPE_ACCEPTED) {
      onItemPress = navigateToContact;
    } else if (type === CHAT) {
      onItemPress = partial(this.navigateToChat, {
        username: notification.username,
        profileImage: notification.avatar,
      });
    }

    const onProfileImagePress = ([TYPE_SENT, TYPE_RECEIVED].includes(type)) ? navigateToContact : undefined;
    const userTitle = notification.firstName ?
      `${notification.firstName} ${notification.lastName}`.trim() :
      notification.username;

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
          <ActivityFeedItemName>{userTitle}</ActivityFeedItemName>
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
      feedTitle,
      sortable,
      contacts,
      invitations,
      historyNotifications,
      history,
      additionalFiltering,
      customFeedData,
    } = this.props;

    const {
      showModal,
      selectedTransaction,
    } = this.state;

    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));
    const mappedHistory = this.mapTransactionsHistory(history, historyNotifications, mappedContacts);
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
    const esTitle = this.props.esTitle || this.state.esTitle;
    const esBody = this.props.esBody || this.state.esBody;
    const activeTab = sortable ? this.state.activeTab : this.props.activeTab;
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
      <View>
        <ActivityFeedHeader>
          <Title subtitle title={feedTitle} />
        </ActivityFeedHeader>
        {!!sortable &&
        <TabWrapper>
          <TabWrapperScrollView horizontal>
            <TabItem
              active={activeTab === ALL}
              onPress={() => this.setState({
                activeTab: ALL,
                esTitle: 'Make your first step',
                esBody: 'Your activity will appear here.',
              })}
            >
              <TabItemIcon active={activeTab === ALL} name="all" />
              <TabItemText active={activeTab === ALL}>All</TabItemText>
            </TabItem>
            <TabItem
              active={activeTab === TRANSACTIONS}
              onPress={() => this.setState({
                activeTab: TRANSACTIONS,
                esTitle: 'Make your first step',
                esBody: 'Your transactions will appear here. Send or receive tokens to start.',
              })}
            >
              <TabItemIcon active={activeTab === TRANSACTIONS} name="send" />
              <TabItemText active={activeTab === TRANSACTIONS}>Transactions</TabItemText>
            </TabItem>
            <TabItem
              active={activeTab === SOCIAL}
              onPress={() => this.setState({
                activeTab: SOCIAL,
                esTitle: 'Make your first step',
                esBody: 'Information on your connections will appear here. Send a connection request to start.',
              })}
            >
              <TabItemIcon active={activeTab === SOCIAL} name="social" />
              <TabItemText active={activeTab === SOCIAL}>Social</TabItemText>
            </TabItem>
          </TabWrapperScrollView>
        </TabWrapper>}
        <ActivityFeedWrapper>
          <ActivityFeedList
            data={processedHistory}
            extraData={notifications}
            renderItem={this.renderActivityFeedItem}
            ItemSeparatorComponent={Separator}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<EmptyTransactions title={esTitle} bodyText={esBody} />}
          />
          <SlideModal
            isVisible={showModal}
            title="transaction details"
            onModalHide={() => { this.setState({ showModal: false }); }}
          >
            <TXDetails transaction={selectedTransaction} />
          </SlideModal>
        </ActivityFeedWrapper>
      </View>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  notifications: { data: notifications },
  history: { data: history, historyNotifications },
  invitations: { data: invitations },
  assets: { data: assets },
  wallet: { data: wallet },
}) => ({
  contacts,
  notifications,
  history,
  historyNotifications,
  invitations,
  assets: Object.values(assets),
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ActivityFeed);
