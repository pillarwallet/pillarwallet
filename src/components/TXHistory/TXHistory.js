// @flow
import * as React from 'react';
import { FlatList, Text, Linking } from 'react-native';
import { Icon } from 'native-base';
import Title from 'components/Title';
import type { Transaction } from 'models/Transaction';
import { Grid, Row, Column } from 'components/Grid';
import { Label } from 'components/Typography';
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


const iconUp = require('../../assets/icons/up.png');
const iconDown = require('../../assets/icons/down.png');

const blockchainExplorerURL = 'https://ropsten.etherscan.io/tx/';

type Props = {
  history: Transaction[],
  token: string,
  address: string,
  onRefresh: Function
}

type State = {
  showModal: boolean,
  selectedTransaction: {
    hash: string,
    token: string | null,
    amount: number | null,
    recepient: string | null,
    note: string | null,
    fee: number | null,
    confirmations: number | null,
    status: string | null,
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
      hash: '',
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
      hash,
    } = transaction;

    this.setState({
      selectedTransaction: {
        hash,
        token: asset,
        amount: formatETHAmount(value),
        recepient: `${to.slice(0, 7)}…${to.slice(-7)}`,
        fee: 0.04,
        note: null,
        confirmations: nbConfirmations,
        status: status.charAt(0).toUpperCase() + status.slice(1),
      },
      showModal: true,
    });
  }

  viewTransactionOnBlockchain = (hash: string) => {
    Linking.openURL(blockchainExplorerURL + hash);
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
      <Item key={id} onPress={() => this.selectTransaction(transaction)}>
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
          onModalHide={() => { this.setState({ showModal: false }); }}
        >
          <Grid>
            <Row size="0 0 40px">
              <Column><Label>You sent</Label></Column>
              <Column>
                <Text>{selectedTransaction.amount} {selectedTransaction.token}</Text>
              </Column>
            </Row>

            <Row size="0 0 40px">
              <Column><Label>Recepient</Label></Column>
              <Column>
                <Text>{selectedTransaction.recepient}</Text>
              </Column>
            </Row>
            <Row size="0 0 40px">
              <Column><Label>Transaction fee</Label></Column>
              <Column>
                <Text>{selectedTransaction.fee}</Text>
              </Column>
            </Row>
            {selectedTransaction.note &&
              <Row size="0 0 80px">
                <Column><Label>Note</Label></Column>
                <Column>
                  <Text>{selectedTransaction.note}</Text>
                </Column>
              </Row>
            }
            <Row size="0 0 40px">
              <Column><Label>Confirmations</Label></Column>
              <Column>
                <Text>{selectedTransaction.confirmations}</Text>
              </Column>
            </Row>
            <Row size="0 0 40px">
              <Column><Label>Status</Label></Column>
              <Column>
                <Text>{selectedTransaction.status}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Button
                  style={{ marginBottom: 20, marginTop: 20 }}
                  title="View on the blockchain"
                  onPress={() => this.viewTransactionOnBlockchain(selectedTransaction.hash)}
                />
              </Column>
            </Row>
          </Grid>

        </SlideModal>
      </React.Fragment>
    );
  }
}
