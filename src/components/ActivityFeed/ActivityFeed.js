// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { FlatList, TouchableOpacity, Image } from 'react-native';
import { format as formatDate } from 'date-fns';
import { fontSizes, baseColors, fontWeights } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import { SubHeading } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import { Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

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


const NOTIFICATION_LABELS = {
  [TYPE_ACCEPTED]: 'New connection',
  [TYPE_RECEIVED]: 'Incoming connection',
  [TYPE_SENT]: 'Connection request sent',
  [TYPE_REJECTED]: 'Connection rejected',
  [TRANSACTION_RECEIVED]: 'Received',
  [TRANSACTION_SENT]: 'Sent',
};

const ActivityFeedWrapper = styled.View`
  height: 100%;
`;

const ActivityFeedHeader = styled.View`
  padding: 16px 16px 0;
`;

const ActivityFeedItem = styled.View`
  background-color: ${props => props.isEven ? baseColors.white : baseColors.snowWhite};
  height: 60px;
  padding: 0 16px;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
`;

const ActivityFeedItemLabel = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraSmall};
  margin-bottom: 2px;
`;

const ActivityFeedItemName = styled.Text`
  font-size: ${fontSizes.medium};
`;

const ActivityFeedItemAmount = styled.Text`
  font-weight: ${fontWeights.bold};
  font-size: ${fontSizes.small};
  color: ${props => props.received ? baseColors.jadeGreen : baseColors.slateBlack};
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
  height: 44px;
  align-items: center;
  justify-content: center;
  flex: ${props => props.flex ? props.flex : 1};
  border-color: ${props => props.active ? baseColors.electricBlue : baseColors.lightGray};
  border-bottom-width: 2px;
`;

const TabItemText = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${props => props.active ? fontWeights.bold : fontWeights.book};
  color: ${props => props.active ? baseColors.slateBlack : baseColors.darkGray};
`;

const ActionCircleButton = styled(ButtonIcon)`
  height: 34px;
  width: 34px;
  border-radius: 17px;
  padding: 0;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;

const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

const LabelText = styled.Text`
  font-size: ${fontSizes.small};
  color: ${(props) => props.button ? baseColors.electricBlue : baseColors.darkGray};
  margin-left: auto;
`;

const EmptyStateBGWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 16px;
`;

type Props = {
  history: Array<*>,
  onAcceptInvitation: Function,
  onCancelInvitation: Function,
  onRejectInvitation: Function,
}

type State = {
  activeTab: string,
  esTitle: string,
  esBody: string,
}

const esLeft = require('assets/images/esLeft.png');
const esRight = require('assets/images/esRight.png');

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
              fontSize={32}
              onPress={() => onRejectInvitation(notification)}
            />
            <ActionCircleButton
              color={baseColors.white}
              margin={0}
              accept
              icon="ios-checkmark"
              fontSize={32}
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

renderActivityFeedItem = ({ item: notification }: Object, index: number) => {
  const isEven = index % 2 === 0;
  const { type } = notification;
  const dateTime = formatDate(new Date(notification.createdAt * 1000), 'MMM Do');
  if (type === TRANSACTION_EVENT) {
    const received = notification.value > 0;
    const fromAddress = `${notification.fromAddress.slice(0, 7)}…${notification.fromAddress.slice(-7)}`;
    const displayName = notification.username ? notification.username : fromAddress;
    const directionSymbol = received ? '+' : '-';
    const value = utils.formatUnits(utils.bigNumberify(notification.value));
    const direction = received ? TRANSACTION_RECEIVED : TRANSACTION_SENT;
    return (
      <ActivityFeedItem isEven={isEven} key={index}>
        <ActivityFeedItemCol fixedWidth="42px">
          <ProfileImage
            uri={notification.avatar}
            userName={displayName}
            diameter={32}
            containerStyle={{ marginRight: 10 }}
            textStyle={{ fontSize: 14 }}
          />
        </ActivityFeedItemCol>
        <ActivityFeedItemCol >
          <ActivityFeedItemLabel>{NOTIFICATION_LABELS[direction]} · {dateTime}</ActivityFeedItemLabel>
          <ActivityFeedItemName>{displayName}</ActivityFeedItemName>
        </ActivityFeedItemCol>
        <ActivityFeedItemCol flexEnd>
          <ActivityFeedItemAmount received={received}>
            {directionSymbol}{value} {notification.asset}
          </ActivityFeedItemAmount>
        </ActivityFeedItemCol>
      </ActivityFeedItem>
    );
  }
  return (
    <ActivityFeedItem isEven={isEven} key={index}>
      <ActivityFeedItemCol fixedWidth="42px">
        <ProfileImage
          uri={notification.avatar}
          userName={notification.username}
          diameter={32}
          containerStyle={{ marginRight: 10 }}
          textStyle={{ fontSize: 14 }}
        />
      </ActivityFeedItemCol>
      <ActivityFeedItemCol>
        <ActivityFeedItemLabel>{NOTIFICATION_LABELS[notification.type]} · {dateTime}</ActivityFeedItemLabel>
        <ActivityFeedItemName>{notification.username}</ActivityFeedItemName>
      </ActivityFeedItemCol>
      <ActivityFeedItemCol flexEnd>
        {this.getSocialAction(type, notification)}
      </ActivityFeedItemCol>
    </ActivityFeedItem>
  );
};

renderActivityFeedEmptyState = () => {
  const { esTitle, esBody } = this.state;
  return (
    <Wrapper
      fullScreen
      style={{
        paddingTop: 80,
        paddingBottom: 80,
        alignItems: 'center',
      }}
    >
      <EmptyStateBGWrapper>
        <Image source={esLeft} />
        <Image source={esRight} />
      </EmptyStateBGWrapper>
      <EmptyStateParagraph
        title={esTitle}
        bodyText={esBody}
      />
    </Wrapper>
  );
}

render() {
  const { activeTab } = this.state;
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
        <SubHeading>ACTIVITY</SubHeading>
      </ActivityFeedHeader>
      <TabWrapper>
        <TabItem
          active={activeTab === ALL}
          onPress={() => this.setState({
            activeTab: ALL,
            esTitle: 'Make your first step',
            esBody: 'Your activity will appear here.',
          })}
          flex={1}
        >
          <TabItemText active={activeTab === ALL}>All</TabItemText>
        </TabItem>
        <TabItem
          active={activeTab === TRANSACTIONS}
          onPress={() => this.setState({
            activeTab: TRANSACTIONS,
            esTitle: 'Make your first step',
            esBody: 'Your transactions will appear here. Send or receive tokens to start.',
          })}
          flex={1}
        >
          <TabItemText active={activeTab === TRANSACTIONS}>Transactions</TabItemText>
        </TabItem>
        <TabItem
          active={activeTab === SOCIAL}
          onPress={() => this.setState({
            activeTab: SOCIAL,
            esTitle: 'Make your first step',
            esBody: 'Information on your connections will appear here. Send a connection request to start.',
          })}
          flex={1}
        >
          <TabItemText active={activeTab === SOCIAL}>Social</TabItemText>
        </TabItem>
      </TabWrapper>
      <FlatList
        data={filteredHistory}
        renderItem={this.renderActivityFeedItem}
        keyExtractor={({ createdAt }) => createdAt.toString()}
        ListEmptyComponent={this.renderActivityFeedEmptyState}
      />
    </ActivityFeedWrapper>
  );
}
}
