// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { TouchableOpacity, Platform } from 'react-native';
import { format as formatDate } from 'date-fns';
import { fontSizes, baseColors } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import Icon from 'components/Icon';
import { BaseText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import EmptyTransactions from 'components/EmptyState/EmptyTransactions';
import Separator from 'components/Separator';

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

const NOTIFICATION_LABELS = {
  [TYPE_ACCEPTED]: 'New connection',
  [TYPE_RECEIVED]: 'Incoming connection',
  [TYPE_SENT]: 'Request sent',
  [TYPE_REJECTED]: 'Connection rejected',
  [TRANSACTION_RECEIVED]: 'Received',
  [TRANSACTION_SENT]: 'Sent',
};

const TRANSACTIONS = 'TRANSACTIONS';
const SOCIAL = 'SOCIAL';


const ActivityFeedList = styled.FlatList``;

const ActivityFeedWrapper = styled.View`
`;

const ActivityFeedItem = styled.View`
  background-color: ${props => props.isEven ? baseColors.snowWhite : baseColors.white};
  height: 74px;
  padding: 0px 16px;
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
  activeTab: string,
  esTitle: string,
  esBody: string,
}

export default class ActivityFeed extends React.Component<Props> {
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

  renderActivityFeedItem = ({ item: notification, index }: Object) => {
    const { type } = notification;
    const { walletAddress } = this.props;
    const dateTime = formatDate(new Date(notification.createdAt * 1000), 'MMM Do');
    if (type === TRANSACTION_EVENT) {
      const isReceived = notification.toAddress.toUpperCase() === walletAddress.toUpperCase();
      const address = isReceived ? notification.fromAddress : notification.toAddress;
      const directionSymbol = isReceived ? '+' : '-';
      const value = utils.formatUnits(utils.bigNumberify(notification.value.toString()));
      const direction = isReceived ? TRANSACTION_RECEIVED : TRANSACTION_SENT;
      const title = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      const directionIcon = isReceived ? 'received' : 'sent';
      return (
        <ActivityFeedItem key={index}>
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
    return (
      <ActivityFeedItem key={index}>
        <ActivityFeedItemCol fixedWidth="50px">
          <ProfileImage
            uri={notification.avatar}
            userName={notification.username}
            diameter={40}
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
    const {
      history, activeTab, esTitle, esBody,
    } = this.props;
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
          renderItem={this.renderActivityFeedItem}
          ItemSeparatorComponent={Separator}
          keyExtractor={({ createdAt }) => createdAt.toString()}
          ListEmptyComponent={<EmptyTransactions title={esTitle} bodyText={esBody} />}
        />
      </ActivityFeedWrapper>
    );
  }
}
