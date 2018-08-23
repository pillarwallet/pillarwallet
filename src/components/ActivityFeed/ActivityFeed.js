// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { TouchableOpacity, Platform } from 'react-native';
import { format as formatDate } from 'date-fns';
import { BigNumber } from 'bignumber.js';

import { resetUnreadAction } from 'actions/chatActions';
import { fontSizes, baseColors, spacing } from 'utils/variables';
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
import { partial } from 'utils/common';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
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

const TRANSACTIONS = 'TRANSACTIONS';
const SOCIAL = 'SOCIAL';

const ActivityFeedList = styled.FlatList``;
const ActivityFeedWrapper = styled.View``;

const ActivityFeedItem = styled.TouchableOpacity`
  background-color: ${props => props.isEven ? baseColors.snowWhite : baseColors.white};
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


type Props = {
  history: Array<*>,
  assets: Asset[],
  onAcceptInvitation: Function,
  onCancelInvitation: Function,
  onRejectInvitation: Function,
  walletAddress: string,
  navigation: NavigationScreenProp<*>,
  notifications: Notification[],
  activeTab: string,
  esTitle: string,
  esBody: string,
  resetUnread: Function,
};

type State = {
  showModal: boolean,
  selectedTransaction: ?Transaction,
};

class ActivityFeed extends React.Component<Props, State> {
  state = {
    showModal: false,
    selectedTransaction: null,
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

  renderActivityFeedItem = ({ item: notification, index }: Object) => {
    const { type } = notification;
    const { walletAddress, navigation, assets } = this.props;
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
      return (
        <ActivityFeedItem key={index} onPress={() => this.selectTransaction({ ...notification, value })}>
          <ActivityFeedItemCol fixedWidth="50px">
            <ActivityFeedDirectionCircle>
              <ActivityFeedDirectionCircleIcon name={directionIcon} />
            </ActivityFeedDirectionCircle>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol>
            <ActivityFeedItemName>{title}</ActivityFeedItemName>
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

    return (
      <ActivityFeedItem key={index} onPress={onItemPress}>
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
      history,
      activeTab,
      esTitle,
      esBody,
      notifications,
    } = this.props;

    const { showModal, selectedTransaction } = this.state;

    const filteredHistory = history.filter(({ type }) => {
      if (activeTab === TRANSACTIONS) {
        return type === TRANSACTION_EVENT;
      }
      if (activeTab === SOCIAL) {
        return SOCIAL_TYPES.includes(type);
      }
      return true;
    });

    return (
      <ActivityFeedWrapper>
        <ActivityFeedList
          data={filteredHistory}
          extraData={notifications}
          renderItem={this.renderActivityFeedItem}
          ItemSeparatorComponent={Separator}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ height: '100%' }}
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
    );
  }
}

const mapStateToProps = ({
  notifications: { data: notifications },
  assets: { data: assets },
}) => ({
  notifications,
  assets: Object.values(assets),
});

const mapDispatchToProps = (dispatch) => ({
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ActivityFeed);
