// @flow
import * as React from 'react';
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
  address: string
}

const Container = styled.ScrollView`
  backgroundColor: #f7f7f7;
  padding: 20px;
  shadowColor: #000;
  shadowOpacity: 0.25;
  shadowRadius: 10;
  shadowOffset: 0px 200px;
  zIndex: 10;
`;

// Looks like a heading (typography), shouldn't it be extracted?
const Header = styled.Text`
  fontWeight: bold;
  fontSize: 20;
`;

const SENT = 'Sent';
const RECEIVED = 'Received';

export default class TXHistory extends React.Component<Props> {
  static defaultProps = {
    history: [],
  }

  renderTransactionHistory() {
    const { history, address } = this.props;
    return history.map((transaction: Transaction) => {
      const {
        status,
        value,
        from,
        _id: id,
        hash,
        asset,
      } = transaction;
      const direction = address.toUpperCase() === from ? SENT : RECEIVED;
      const icon = direction === SENT ? iconDown : iconUp;
      return (
        <Item key={id}>
          <Section small>
            <Icon source={icon} />
          </Section>
          <Section>
            <Direction>{direction}</Direction>
            <Hash>{hash.slice(0, 4)}…{hash.slice(-4)}</Hash>
          </Section>
          <Section>
            <Amount>{formatETHAmount(value)} {asset}</Amount>
            <Status>{status}</Status>
          </Section>
        </Item>
      );
    });
  }

  render() {
    const { history } = this.props;
    if (!history.length) {
      return null;
    }
    return (
      <Container>
        <Header>activity</Header>
        {this.renderTransactionHistory()}
      </Container>
    );
  }
}
