// @flow
import * as React from 'react';
import { connect } from 'react-redux';

import styled from 'styled-components/native';
import { utils } from 'ethers';
import { TouchableOpacity, Platform, Dimensions, Linking } from 'react-native';
import { format as formatDate } from 'date-fns';
import { fontSizes, baseColors } from 'utils/variables';
import type { Notification } from 'models/Notification';
import ButtonIcon from 'components/ButtonIcon';
import Icon from 'components/Icon';
import { BaseText, Label } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import EmptyTransactions from 'components/EmptyState/EmptyTransactions';
import type { NavigationScreenProp } from 'react-navigation';
import Separator from 'components/Separator';
import { Row, Column } from 'components/Grid';
import Button from 'components/Button';
import { formatETHAmount } from 'utils/common';
import SlideModal from 'components/Modals/SlideModal';
import Timestamp from 'components/TXHistory/Timestamp.js';
import { getUserName } from 'utils/contacts';
import { TX_DETAILS_URL } from 'react-native-dotenv';

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
const SENT = 'Sent';
const RECEIVED = 'Received';

const window = Dimensions.get('window');

const ActivityFeedList = styled.FlatList``;

const ActivityFeedWrapper = styled.View``;

const ActivityFeedItem = styled.TouchableOpacity`
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

const ContentWrapper = styled.View`
  height: ${window.height / 2.5};
  justify-content: space-around;
  display: flex;
`;

const Holder = styled.View`
  display: flex;
  flex-direction:column;
  justify-content: space-around;
  align-items: center;
`;

type Props = {
  history: Array<*>,
  onAcceptInvitation: Function,
  onCancelInvitation: Function,
  onRejectInvitation: Function,
  walletAddress: string,
  navigation: NavigationScreenProp<*>,
  notifications: Notification[],
  activeTab: string,
  esTitle: string,
  esBody: string,
};

type State = {
  showModal: boolean,
  selectedTransaction: {
    hash: string,
    date: ?string,
    token: ?string,
    amount: ?number,
    recipient: ?string,
    note: ?string,
    fee: ?number,
    confirmations: ?number,
    status: ?string,
    direction: ?string,
  }
};

class ActivityFeed extends React.Component<Props, State> {

  state = {
    showModal: false,
    selectedTransaction: {
      hash: '',
      date: null,
      token: null,
      amount: null,
      recipient: null,
      fee: null,
      note: null,
      confirmations: null,
      status: null,
      direction: null,
    },
  };

  getDate = (datetime: number) => {
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const date: Date = new Date(0);
    date.setUTCSeconds(datetime);
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  };

  selectTransaction = (transaction: Object) => {
    const {
        status,
        toAddress,
        fromAddress,
        asset,
        nbConfirmations,
        gasUsed,
        gasPrice,
        value,
    } = transaction;
    const timestamp = transaction.createdAt;
    const hash = transaction.txHash;
    const { history, walletAddress } = this.props;
    const datetime = new Date(timestamp);
    const contact = history
        .find(({ ethAddress }) => ethAddress != null && toAddress.toUpperCase() === ethAddress.toUpperCase());
    const recipient = toAddress.toUpperCase() !== walletAddress.toUpperCase()
        ? (getUserName(contact) || `${toAddress.slice(0, 7)}…${toAddress.slice(-7)}`)
        : null;
    const amount = utils.formatUnits(utils.bigNumberify(value.toString()));

    this.setState({
      selectedTransaction: {
        hash,
        date: this.getDate(datetime),
        token: asset,
        amount: formatETHAmount(amount),
        recipient,
        fee: gasUsed ? gasUsed * gasPrice : 0,
        note: null,
        confirmations: nbConfirmations,
        status: status.charAt(0).toUpperCase() + status.slice(1),
        direction: walletAddress.toUpperCase() === fromAddress.toUpperCase() ? SENT : RECEIVED,
      },
      showModal: true,
    });
  };

  viewTransactionOnBlockchain = (hash: string) => {
    Linking.openURL(TX_DETAILS_URL + hash);
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
          <TouchableOpacity
            onPress={() => onCancelInvitation(notification)}
          >
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

  renderActivityFeedItem = ({ item: notification, index }: Object) => {
    const { type } = notification;
    const { walletAddress, navigation } = this.props;

    const dateTime = formatDate(new Date(notification.createdAt * 1000), 'MMM Do');
    if (type !== TRANSACTION_EVENT && type !== CHAT) {
      notification.onPress = () => navigation.navigate(CONTACT, { contact: notification });
    }
    if (type === TRANSACTION_EVENT) {
      const isReceived = notification.toAddress.toUpperCase() === walletAddress.toUpperCase();
      const address = isReceived ? notification.fromAddress : notification.toAddress;
      const directionSymbol = isReceived ? '+' : '-';
      const value = utils.formatUnits(utils.bigNumberify(notification.value.toString()));
      const direction = isReceived ? TRANSACTION_RECEIVED : TRANSACTION_SENT;
      const title = notification.username || `${address.slice(0, 6)}…${address.slice(-6)}`;
      const directionIcon = isReceived ? 'received' : 'sent';
      return (
        <ActivityFeedItem key={index} onPress={() => this.selectTransaction(notification)}>
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
      <ActivityFeedItem key={index} onPress={notification.onPress}>
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
          <ContentWrapper>
            <Holder>
              <Row size="0 0 30px">
                <Column>
                  <Label>You {selectedTransaction.direction === SENT ? 'sent' : 'received'}</Label>
                </Column>
                <Column>
                  <BaseText>{selectedTransaction.amount} {selectedTransaction.token}</BaseText>
                </Column>
              </Row>
              <Row size="0 0 30px">
                <Column><Label>Date</Label></Column>
                <Column>
                  <BaseText>{selectedTransaction.date}</BaseText>
                </Column>
              </Row>
              {!!selectedTransaction.recipient &&
              <Row size="0 0 30px">
                <Column><Label>Recipient</Label></Column>
                <Column>
                  <BaseText>{selectedTransaction.recipient}</BaseText>
                </Column>
              </Row>
              }
              {!!selectedTransaction.fee &&
              <Row size="0 0 30px">
                <Column><Label>Transaction fee</Label></Column>
                <Column>
                  <BaseText>{utils.formatEther(selectedTransaction.fee.toString())} ETH</BaseText>
                </Column>
              </Row>
              }

              {selectedTransaction.note &&
              <Row size="0 0 80px">
                <Column><Label>Note</Label></Column>
                <Column>
                  <BaseText>{selectedTransaction.note}</BaseText>
                </Column>
              </Row>
              }
              <Row size="0 0 30px">
                <Column><Label>Status</Label></Column>
                <Column>
                  <BaseText>{selectedTransaction.status}</BaseText>
                </Column>
              </Row>
            </Holder>
            <Holder>
              <Button
                  title="View on the blockchain"
                  onPress={() => this.viewTransactionOnBlockchain(selectedTransaction.hash)}
              />
            </Holder>
          </ContentWrapper>
        </SlideModal>
      </ActivityFeedWrapper>
    );
  }
}

const mapStateToProps = ({
  notifications: { data: notifications },
}) => ({
  notifications,
});

export default connect(mapStateToProps)(ActivityFeed);
