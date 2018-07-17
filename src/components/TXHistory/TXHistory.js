// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { FlatList, Linking, Image, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { TX_DETAILS_URL } from 'react-native-dotenv';
import Title from 'components/Title';
import type { Transaction } from 'models/Transaction';
import { Row, Column } from 'components/Grid';
import { Label, BaseText } from 'components/Typography';
import Button from 'components/Button';
import { formatETHAmount } from 'utils/common';
import { baseColors } from 'utils/variables';
import SlideModal from 'components/Modals/SlideModal';
import Item from './Item';
import Amount from './Amount';
import Hash from './Hash';
import Status from './Status';
import Timestamp from './Timestamp';
import Section from './Section';

const window = Dimensions.get('window');
const iconUp = require('assets/icons/up.png');
const iconDown = require('assets/icons/down.png');

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
  history: Transaction[],
  token: string,
  wallet: Object,
}

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
}

const flatListStyles = {
  justifyContent: 'flex-start',
  flex: 1,
  backgroundColor: baseColors.lightGray,
  paddingLeft: 16,
  paddingRight: 16,
};

const TXHistoryHeader = styled.View`
  align-items: flex-start;
  padding: 10px 16px 0;
`;

const SENT = 'Sent';
const RECEIVED = 'Received';

class TXHistory extends React.Component<Props, State> {
  static defaultProps = {
    history: [],
  };

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

  getDirectionSymbol = (direction: string) => {
    if (direction === SENT) {
      return '-';
    } else if (direction === RECEIVED) {
      return '+';
    }
    return null;
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
      value,
      to,
      from,
      asset,
      nbConfirmations,
      hash,
      timestamp,
      gasUsed,
    } = transaction;
    const datetime = new Date(timestamp);
    const myAddress = this.props.wallet.address;
    this.setState({
      selectedTransaction: {
        hash,
        date: this.getDate(datetime),
        token: asset,
        amount: formatETHAmount(value),
        recipient: `${to.slice(0, 7)}…${to.slice(-7)}`,
        fee: gasUsed ? gasUsed.toFixed(6) : 0,
        note: null,
        confirmations: nbConfirmations,
        status: status.charAt(0).toUpperCase() + status.slice(1),
        direction: myAddress.toUpperCase() === from.toUpperCase() ? SENT : RECEIVED,
      },
      showModal: true,
    });
  };

  viewTransactionOnBlockchain = (hash: string) => {
    Linking.openURL(TX_DETAILS_URL + hash);
  };

  renderTransaction = ({ item: transaction }: { item: Transaction }) => {
    const {
      status,
      value,
      from,
      to,
      _id: id,
      asset,
      timestamp,
    } = transaction;
    const myAddress = this.props.wallet.address;
    const direction = myAddress.toUpperCase() === from.toUpperCase() ? SENT : RECEIVED;
    const datetime = new Date(timestamp);
    const icon = direction === SENT ? iconUp : iconDown;
    const senderRecipientAddress = direction === SENT ? to : from;
    return (
      <Item key={id} onPress={() => this.selectTransaction(transaction)}>
        <Image source={icon} style={{ width: 35, height: 35, marginRight: 10 }} />
        <Section>
          <Hash>{senderRecipientAddress.slice(0, 7)}…{senderRecipientAddress.slice(-7)}</Hash>
          <Timestamp>{this.getDate(datetime)}</Timestamp>
        </Section>
        <Section>
          <Amount direction={direction}>{this.getDirectionSymbol(direction)} {formatETHAmount(value)} {asset}</Amount>
          <Status>{status.toUpperCase()}</Status>
        </Section>
      </Item>
    );
  };

  render() {
    const { history } = this.props;
    const { showModal, selectedTransaction } = this.state;
    return (
      <React.Fragment>
        <TXHistoryHeader>
          <Title noMargin title="transactions" />
        </TXHistoryHeader>
        <FlatList
          refreshing={false}
          data={history}
          renderItem={this.renderTransaction}
          keyExtractor={(({ _id }) => _id)}
          contentContainerStyle={flatListStyles}
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

              <Row size="0 0 30px">
                <Column><Label>Recipient</Label></Column>
                <Column>
                  <BaseText>{selectedTransaction.recipient}</BaseText>
                </Column>
              </Row>
              <Row size="0 0 30px">
                <Column><Label>Transaction fee</Label></Column>
                <Column>
                  <BaseText>{selectedTransaction.fee} ETH</BaseText>
                </Column>
              </Row>

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
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet } }) => ({
  wallet,
});

export default connect(mapStateToProps)(TXHistory);
