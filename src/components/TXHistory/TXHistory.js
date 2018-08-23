// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { FlatList, Image } from 'react-native';
import styled from 'styled-components/native';
import { format as formatDate } from 'date-fns';
import Title from 'components/Title';
import type { Transaction } from 'models/Transaction';
import { getUserName } from 'utils/contacts';
import { spacing, fontSizes } from 'utils/variables';
import SlideModal from 'components/Modals/SlideModal';
import EmptyTransactions from 'components/EmptyState/EmptyTransactions';
import TXDetails from 'components/TXDetails';
import ProfileImage from 'components/ProfileImage';
import Item from './Item';
import Amount from './Amount';
import Hash from './Hash';
import Status from './Status';
import Timestamp from './Timestamp';
import Section from './Section';

const iconUp = require('assets/icons/up.png');
const iconDown = require('assets/icons/down.png');


type Props = {
  history: Transaction[],
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

const IconWrapper = styled.View`
  align-items: flex-start;
  margin-right: ${spacing.rhythm}px;
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
    const { contacts, wallet: { address: myAddress } } = this.props;
    const direction = myAddress.toUpperCase() === from.toUpperCase() ? SENT : RECEIVED;
    const dateTime = formatDate(new Date(createdAt * 1000), 'MMM Do');
    const icon = direction === SENT ? iconUp : iconDown;
    const senderRecipientAddress = direction === SENT ? to : from;
    const contact: any = contacts
      .find(({ ethAddress }) => senderRecipientAddress.toUpperCase() === ethAddress.toUpperCase());
    const address = getUserName(contact) || `${senderRecipientAddress.slice(0, 7)}…${senderRecipientAddress.slice(-7)}`;
    const amount = utils.formatUnits(utils.bigNumberify(value.toString()));
    const isEven = index % 2;
    let image;

    const nameOrAddress = contact.firstName ? `${contact.firstName} ${contact.lastName}` : address;

    if (getUserName(contact)) {
      image = (<ProfileImage
        uri={contact.profileImage}
        userName={address}
        diameter={40}
        textStyle={{ fontSize: fontSizes.medium }}
      />);
    } else {
      image = <Image source={icon} style={{ width: 40, height: 40 }} />;
    }

    return (
      <Item key={id} onPress={() => this.selectTransaction(transaction)} isEven={isEven}>
        <IconWrapper>
          { image }
        </IconWrapper>
        <Section>
          <Hash>{nameOrAddress}</Hash>
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
}) => ({
  wallet,
  contacts,
});

export default connect(mapStateToProps)(TXHistory);
