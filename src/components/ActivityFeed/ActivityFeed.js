// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { format as formatDate } from 'date-fns';
import { fontSizes, baseColors, spacingSizes } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import Title from 'components/Title';
import Icon from 'components/Icon';
import { BaseText, BoldText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import EmptyTransactions from 'components/EmptyState/EmptyTransactions';

import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

const TRANSACTION_RECEIVED = 'TRANSACTION_RECEIVED';
const TRANSACTION_SENT = 'TRANSACTION_SENT';
const SOCIAL_TYPES = [
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
];

const TRANSACTIONS = 'TRANSACTIONS';
const SOCIAL = 'SOCIAL';
const ALL = 'ALL';
const iconUp = require('assets/icons/up.png');
const iconDown = require('assets/icons/down.png');

const NOTIFICATION_LABELS = {
  [TYPE_ACCEPTED]: 'New connection',
  [TYPE_RECEIVED]: 'Incoming connection',
  [TYPE_SENT]: 'Request sent',
  [TYPE_REJECTED]: 'Connection rejected',
  [TRANSACTION_RECEIVED]: 'Received',
  [TRANSACTION_SENT]: 'Sent',
};

const ActivityFeedWrapper = styled.View`
  height: 100%;
`;

const ActivityFeedHeader = styled.View`
  padding: 0 ${spacingSizes.defaultHorizontalSideSpacing}px;
`;

const ActivityFeedItem = styled.View`
  background-color: ${props => props.isEven ? baseColors.snowWhite : baseColors.white};
  height: 74px;
  padding: 0px 16px;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
`;

const ActivityFeedItemLabel = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraSmall};
  margin-bottom: 2px;
`;

const ActivityFeedItemName = styled(BaseText)`
  font-size: ${fontSizes.small};
`;

const ActivityFeedItemAmount = styled(BoldText)`
  font-size: ${fontSizes.extraSmall};
  color: ${props => props.received ? baseColors.jadeGreen : baseColors.fireEngineRed};
`;

const ActivityFeedItemCol = styled.View`
  flex: ${props => props.fixedWidth ? `0 0 ${props.fixedWidth}` : 1};
  flex-direction: column;
  align-items: ${props => props.flexEnd ? 'flex-end' : 'flex-start'};
  justify-content: center;
`;

const TabWrapper = styled.View`
  flex-direction: row;
  margin: 10px 16px 10px;
`;

const TabItem = styled.TouchableOpacity`
  height: 32px;
  padding: 0 15px;
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

const ActionCircleButton = styled(ButtonIcon)`
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
  onAcceptInvitation: Function,
  onCancelInvitation: Function,
  onRejectInvitation: Function,
  walletAddress: string,
}

type State = {
  activeTab: string,
  esTitle: string,
  esBody: string,
}

export default class ActivityFeed extends React.Component<Props, State> {
  state = {
    activeTab: 'ALL',
    esTitle: 'Make your first step',
    esBody: 'Your activity will appear here.',
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
              fontSize={fontSizes.small}
              onPress={() => onRejectInvitation(notification)}
            />
            <ActionCircleButton
              color={baseColors.white}
              margin={0}
              accept
              icon="check"
              fontSize={fontSizes.small}
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
          <TouchableOpacity
            onPress={() => onCancelInvitation(notification)}
          >
            <LabelText button>
              Cancel
            </LabelText>
          </TouchableOpacity >
        );
      default:
        return (
          <LabelText>
            Dismissed
          </LabelText>
        );
    }
  };

  openMoreFilterOptions = () => {
    // Three dots link in filter tab bar logic should go here
  }

  renderActivityFeedItem = ({ item: notification, index }: Object) => {
    const isEven = index % 2;
    const { type } = notification;
    const { walletAddress } = this.props;
    const dateTime = formatDate(new Date(notification.createdAt * 1000), 'MMM Do');
    if (type === TRANSACTION_EVENT) {
      const isReceived = notification.toAddress.toUpperCase() === walletAddress.toUpperCase();
      const address = isReceived ? notification.fromAddress : notification.toAddress;
      const directionSymbol = isReceived ? '+' : '-';
      const value = utils.formatUnits(utils.bigNumberify(notification.value.toString()));
      const direction = isReceived ? TRANSACTION_RECEIVED : TRANSACTION_SENT;
      const title = notification.username || `${address.slice(0, 7)}…${address.slice(-7)}`;
      const directionIcon = isReceived ? iconDown : iconUp;
      return (
        <ActivityFeedItem isEven={isEven} key={index}>
          <ActivityFeedItemCol fixedWidth="44px">
            <Image source={directionIcon} style={{ width: 36, height: 36 }} />
          </ActivityFeedItemCol>
          <ActivityFeedItemCol fixedWidth="150px">
            <ActivityFeedItemName>{title}</ActivityFeedItemName>
            <ActivityFeedItemLabel>{NOTIFICATION_LABELS[direction]} · {dateTime}</ActivityFeedItemLabel>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol flexEnd>
            <ActivityFeedItemAmount received={isReceived}>
              {directionSymbol}{value} {notification.asset}
            </ActivityFeedItemAmount>
          </ActivityFeedItemCol>
        </ActivityFeedItem>
      );
    }
    return (
      <ActivityFeedItem isEven={isEven} key={index}>
        <ActivityFeedItemCol fixedWidth="44px">
          <ProfileImage
            uri={notification.avatar}
            userName={notification.username}
            diameter={36}
            textStyle={{ fontSize: 14 }}
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
    const { activeTab, esTitle, esBody } = this.state;
    const { history } = this.props;
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
        <ActivityFeedHeader>
          <Title subtitle title="your activity." />
        </ActivityFeedHeader>
        <TabWrapper>
          <TabItem
            active={activeTab === ALL}
            onPress={() => this.setState({
              activeTab: ALL,
              esTitle: 'Make your first step',
              esBody: 'Your activity will appear here.',
            })}
          >
            <TabItemIcon active={activeTab === ALL} name="chat" />
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
            <TabItemIcon active={activeTab === TRANSACTIONS} name="settings" />
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
            <TabItemIcon active={activeTab === SOCIAL} name="warning" />
            <TabItemText active={activeTab === SOCIAL}>Social</TabItemText>
          </TabItem>
          <TabItem
            onPress={() => this.openMoreFilterOptions}
          >
            <TabItemIcon active={activeTab === SOCIAL} name="help" />
          </TabItem>
        </TabWrapper>
        <FlatList
          data={filteredHistory}
          renderItem={this.renderActivityFeedItem}
          keyExtractor={({ createdAt }) => createdAt.toString()}
          contentContainerStyle={{ height: '100%' }}
          ListEmptyComponent={<EmptyTransactions title={esTitle} bodyText={esBody} />}
        />
      </ActivityFeedWrapper>
    );
  }
}
