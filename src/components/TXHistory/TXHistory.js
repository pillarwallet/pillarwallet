// @flow
import * as React from 'react';
import { FlatList, Text } from 'react-native';
import Title from 'components/Title';
import type { Transaction } from 'models/Transaction';
import { formatETHAmount } from 'utils/common';
import { baseColors } from 'utils/variables';
import SlideModal from 'components/Modals/SlideModal';
import Item from './Item';
import Icon from './Icon';
import Amount from './Amount';
import Hash from './Hash';
import Status from './Status';
import Timestamp from './Timestamp';
import Section from './Section';


const iconUp = require('../../assets/icons/up.png');
const iconDown = require('../../assets/icons/down.png');

type Props = {
  history: Transaction[],
  token: string,
  address: string,
  onRefresh: Function
}

type State = {
  showModal: boolean,
  selectedTransaction: {
    token: ?string,
    amount: ?number,
    recepient: ?string,
    note: ?string,
    fee: ?number,
    confirmations: ?number,
    status: ?string,
  }
}

const flatListStyles = {
  justifyContent: 'flex-start',
  flex: 1,
  backgroundColor: baseColors.lightGray,
  padding: 20,
};

const SENT = 'Sent';
const RECEIVED = 'Received';

export default class TXHistory extends React.Component<Props, State> {
  static defaultProps = {
    history: [],
    onRefresh: () => { },
  };

  state = {
    showModal: false,
    selectedTransaction: {
      token: null,
      amount: null,
      recepient: null,
      fee: null,
      note: null,
      confirmations: null,
      status: null,
    },
  }

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
      asset,
      nbConfirmations,
    } = transaction;

    this.setState({
      selectedTransaction: {
        token: asset,
        amount: formatETHAmount(value),
        recepient: to,
        fee: 0.04,
        note: null,
        confirmations: nbConfirmations,
        status,
      },
      showModal: true,
    });
  }
  renderTransaction = ({ item: transaction }: { item: Transaction }) => {
    const {
      status,
      value,
      from,
      to,
      _id: id,
      asset,
      tmstmp,
    } = transaction;
    const { address } = this.props;
    const direction = address.toUpperCase() === from.toUpperCase() ? SENT : RECEIVED;
    const datetime = new Date(tmstmp);
    const icon = direction === SENT ? iconDown : iconUp;
    const senderRecipientAddress = direction === SENT ? to : from;
    return (
      <Item key={id} onPress={this.selectTransaction(transaction)}>
        <Section small>
          <Icon source={icon} />
        </Section>
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
    const { history, address, onRefresh } = this.props;
    const { showModal, selectedTransaction } = this.state;
    return (
      <React.Fragment>
        <FlatList
          refreshing={false}
          onRefresh={onRefresh}
          ListHeaderComponent={<Title title="activity" />}
          data={history}
          extraData={address}
          renderItem={this.renderTransaction}
          keyExtractor={(({ _id }) => _id)}
          contentContainerStyle={flatListStyles}
        />
        <SlideModal
          isVisible={showModal}
          title="transaction details"
        >
          <Text>{selectedTransaction.amount} {selectedTransaction.token}</Text>
          <Text>{selectedTransaction.recepient}</Text>
          <Text>{selectedTransaction.fee}</Text>
          <Text>{selectedTransaction.note}</Text>
          <Text>{selectedTransaction.confirmations}</Text>
          <Text>{selectedTransaction.status}</Text>

        </SlideModal>


      </React.Fragment>
    );
  }
}
