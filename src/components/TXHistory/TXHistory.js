// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import { format as formatDate } from 'date-fns';
import { BigNumber } from 'bignumber.js';
import Title from 'components/Title';
import type { Transaction } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import { getUserName } from 'utils/contacts';
import { spacing, baseColors, fontSizes } from 'utils/variables';
import Icon from 'components/Icon';
import SlideModal from 'components/Modals/SlideModal';
import EmptyTransactions from 'components/EmptyState/EmptyTransactions';
import TXDetails from 'components/TXDetails';
import Item from './Item';
import Amount from './Amount';
import Hash from './Hash';
import Status from './Status';
import Timestamp from './Timestamp';
import Section from './Section';


type Props = {
  history: Transaction[],
  assets: Asset[],
  contacts: Object[],
  token: string,
  wallet: Object,
}

type State = {
  showModal: boolean,
  selectedTransaction: ?Transaction,
}

const flatListStyles = {
  justifyContent: 'flex-start',
  flex: 1,
};

const TXHistoryHeader = styled.View`
  align-items: flex-start;
  padding: 10px ${spacing.rhythm}px 0;
`;

const DirectionIcon = styled(Icon)`
  font-size: ${fontSizes.giant}px;
`;

const DirectionIconWrapper = styled.View`
  background-color: ${baseColors.lightGray};
  margin-right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
`;

const SENT = 'Sent';
const RECEIVED = 'Received';

class TXHistory extends React.Component<Props, State> {
  static defaultProps = {
    history: [],
  };

  state = {
    showModal: false,
    selectedTransaction: null,
  };

  getDirectionSymbol = (direction: string) => {
    if (direction === SENT) {
      return '-';
    } else if (direction === RECEIVED) {
      return '+';
    }
    return null;
  };

  selectTransaction = (transaction: Transaction) => {
    this.setState({
      selectedTransaction: transaction,
      showModal: true,
    });
  };

  renderTransaction = ({ item: transaction, index }: { item: Transaction, index: number }) => {
    const {
      status,
      value,
      from,
      to,
      _id: id,
      asset,
      createdAt,
    } = transaction;
    const { contacts, wallet: { address: myAddress }, assets } = this.props;
    const direction = myAddress.toUpperCase() === from.toUpperCase() ? SENT : RECEIVED;
    const dateTime = formatDate(new Date(createdAt * 1000), 'MMM Do');
    const icon = direction === SENT ? 'sent' : 'received';
    const senderRecipientAddress = direction === SENT ? to : from;
    const contact = contacts
      .find(({ ethAddress }) => senderRecipientAddress.toUpperCase() === ethAddress.toUpperCase());
    const address = getUserName(contact) || `${senderRecipientAddress.slice(0, 7)}…${senderRecipientAddress.slice(-7)}`;
    const { decimals = 18 } = assets.find(({ symbol }) => symbol === asset) || {};
    const amount = utils.formatUnits(new BigNumber(value.toString()).toFixed(), decimals);
    const isEven = index % 2;
    return (
      <Item key={id} onPress={() => this.selectTransaction({ ...transaction, value: amount })} isEven={isEven}>
        <DirectionIconWrapper>
          <DirectionIcon name={icon} />
        </DirectionIconWrapper>
        <Section>
          <Hash>{address}</Hash>
          <Timestamp>{dateTime}</Timestamp>
        </Section>
        <Section>
          <Amount direction={direction}>{this.getDirectionSymbol(direction)} {amount} {asset}</Amount>
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
          ListEmptyComponent={
            <EmptyTransactions
              title="Make your first step"
              bodyText="Your transactions will appear here. Send or receive tokens to start."
            />
          }
        />
        <SlideModal
          isVisible={showModal}
          title="transaction details"
          onModalHide={() => { this.setState({ showModal: false }); }}
        >
          <TXDetails transaction={selectedTransaction} />
        </SlideModal>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  contacts: { data: contacts },
  assets: { data: assets },
}) => ({
  wallet,
  contacts,
  assets: Object.values(assets),
});

export default connect(mapStateToProps)(TXHistory);
