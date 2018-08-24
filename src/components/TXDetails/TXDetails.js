// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Dimensions, Linking } from 'react-native';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { TX_DETAILS_URL } from 'react-native-dotenv';
import { format as formatDate } from 'date-fns';
import type { Transaction } from 'models/Transaction';
import { Column, Row } from 'components/Grid';
import { BaseText, Label } from 'components/Typography';
import Button from 'components/Button';
import { formatETHAmount } from '../../utils/common';
import { getUserName } from '../../utils/contacts';

type Props = {
  transaction: Transaction,
  contacts: Object[],
  wallet: Object,
}

const window = Dimensions.get('window');

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

const SENT = 'Sent';
const RECEIVED = 'Received';

const viewTransactionOnBlockchain = (hash: string) => {
  Linking.openURL(TX_DETAILS_URL + hash);
};

const TXDetails = (props: Props) => {
  const { transaction, contacts, wallet: { address: myAddress } } = props;
  const {
    status,
    to,
    from,
    asset,
    nbConfirmations,
    hash,
    createdAt,
    gasUsed,
    gasPrice,
    value,
  } = transaction;

  const dateTime = formatDate(new Date(createdAt * 1000), 'MMM Do');
  const recipientContact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
  const senderContact = contacts.find(({ ethAddress }) => from.toUpperCase() === ethAddress.toUpperCase());
  const recipient = to.toUpperCase() !== myAddress.toUpperCase()
    ? (getUserName(recipientContact) || `${to.slice(0, 7)}…${to.slice(-7)}`)
    : null;
  const sender = from.toUpperCase() !== myAddress.toUpperCase()
    ? (getUserName(senderContact) || `${to.slice(0, 7)}…${to.slice(-7)}`)
    : null;

  const tx = {
    hash,
    date: dateTime,
    token: asset,
    amount: formatETHAmount(value),
    recipient,
    sender,
    fee: gasUsed ? gasUsed * gasPrice : 0,
    note: null,
    confirmations: nbConfirmations,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    direction: myAddress.toUpperCase() === from.toUpperCase() ? SENT : RECEIVED,
  };

  return (
    <ContentWrapper>
      <Holder>
        <Row size="0 0 30px">
          <Column>
            <Label>You {tx.direction === SENT ? 'sent' : 'received'}</Label>
          </Column>
          <Column>
            <BaseText>{tx.amount} {tx.token}</BaseText>
          </Column>
        </Row>
        <Row size="0 0 30px">
          <Column><Label>Date</Label></Column>
          <Column>
            <BaseText>{tx.date}</BaseText>
          </Column>
        </Row>
        {!!tx.recipient &&
        <Row size="0 0 30px">
          <Column><Label>Recipient</Label></Column>
          <Column>
            <BaseText>{tx.recipient}</BaseText>
          </Column>
        </Row>
        }
        {!!tx.sender &&
        <Row size="0 0 30px">
          <Column><Label>Sender</Label></Column>
          <Column>
            <BaseText>{tx.sender}</BaseText>
          </Column>
        </Row>
        }
        {!!tx.fee && !!tx.confirmations &&
        <Row size="0 0 30px">
          <Column><Label>Transaction fee</Label></Column>
          <Column>
            <BaseText>{utils.formatEther(Math.round(tx.fee).toString())} ETH</BaseText>
          </Column>
        </Row>
        }

        {tx.note &&
        <Row size="0 0 80px">
          <Column><Label>Note</Label></Column>
          <Column>
            <BaseText>{tx.note}</BaseText>
          </Column>
        </Row>
        }
        <Row size="0 0 30px">
          <Column><Label>Status</Label></Column>
          <Column>
            <BaseText>{tx.status}</BaseText>
          </Column>
        </Row>
      </Holder>
      <Holder>
        <Button
          block
          small
          title="View on the Blockchain"
          onPress={() => viewTransactionOnBlockchain(tx.hash)}
        />
      </Holder>
    </ContentWrapper>
  );
};

const mapStateToProps = ({
  contacts: { data: contacts },
  wallet: { data: wallet },
}) => ({
  contacts,
  wallet,
});

export default connect(mapStateToProps)(TXDetails);
