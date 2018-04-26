// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import type { Transaction } from 'models/Transaction';
import { formatETHAmount } from 'utils/common';
import Item from './Item';
import Icon from './Icon';
import Amount from './Amount';
import Hash from './Hash';
import Status from './Status';
import Direction from './Direction';
import Section from './Section';

const iconUp = require('assets/icons/up.png');
const iconDown = require('assets/icons/down.png');

type Props = {
  history: Transaction[],
  token: string,
  address: string,
  onRefresh: Function
}

const Container = styled.View`
  backgroundColor: rgb(246, 246, 246);
  flex: 1;
  flexDirection: row;
`;

// Looks like a heading (typography), shouldn't it be extracted?
const Header = styled.Text`
  fontWeight: bold;
  fontSize: 20;
`;

const flatListStyles = {
  justifyContent: 'flex-start',
  flex: 1,
  backgroundColor: 'rgb(246, 246, 246)',
  padding: 20,
};

const SENT = 'Sent';
const RECEIVED = 'Received';

export default class TXHistory extends React.Component<Props> {
  static defaultProps = {
    history: [],
    onRefresh: () => {},
  }

  renderTransaction = ({ item: transaction }: { item: Transaction }) => {
    const {
      status,
      value,
      from,
      to,
      _id: id,
      asset,
    } = transaction;
    const { address } = this.props;
    const direction = address.toUpperCase() === from.toUpperCase() ? SENT : RECEIVED;
    const icon = direction === SENT ? iconDown : iconUp;
    const senderRecipientAddress = direction === SENT ? to : from;
    return (
      <Item key={id}>
        <Section small>
          <Icon source={icon} />
        </Section>
        <Section>
          <Direction>{direction}</Direction>
          <Hash>{senderRecipientAddress.slice(0, 7)}…{senderRecipientAddress.slice(-7)}</Hash>
        </Section>
        <Section>
          <Amount>{formatETHAmount(value)} {asset}</Amount>
          <Status>{status.toUpperCase()}</Status>
        </Section>
      </Item>
    );
  }

  render() {
    const { history, address, onRefresh } = this.props;
    return (
      <Container>
        <FlatList
          refreshing={false}
          onRefresh={onRefresh}
          ListHeaderComponent={<Header style={{ marginBottom: 10 }}>activity.</Header>}
          data={this.props.history}
          extraData={address}
          renderItem={this.renderTransaction}
          keyExtractor={(({ _id }) => _id)}
          contentContainerStyle={flatListStyles}
        />
      </Container>
    );
  }
}
