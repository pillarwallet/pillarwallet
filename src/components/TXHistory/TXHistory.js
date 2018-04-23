// @flow
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

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
  history: {},
  token: string,
  address: string
}

type State = {
  animFadeIn: any,
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f7f7',
    padding: 20,
    paddingBottom: 80,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    justifyContent: 'flex-end',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 1000 },
  },
  header: {
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default class TXHistory extends React.Component<Props, State> {
  state = {
    animFadeIn: new Animated.Value(0),
  };

  componentDidMount() {
    Animated.timing(
      this.state.animFadeIn,
      {
        toValue: 1,
        duration: 500,
      },
    ).start();
  }

  getTransacionDirection(address: string, fromAddress: string) {
    if (address.toUpperCase() === fromAddress) {
      return 'Sent';
    }
    return 'Recieved';
  }

  getDisplayAmount(amount: number) {
    return +parseFloat(amount).toFixed(6);
  }

  getIcon(direction: string) {
    if (direction === 'Sent') {
      return iconDown;
    }
    return iconUp;
  }

  generateTransactionHistoryList(history: any) {
    let i = 0;
    const transactionHistoryList = [];
    for (i = 0; i < history.length; i += 1) {
      const direction = this.getTransacionDirection(this.props.address, history[i].from);
      transactionHistoryList.push(
        <Item key={`${i}item`}>
          <Section small>
            <Icon source={this.getIcon(direction)} />
          </Section>
          <Section>
            <Direction>{direction}</Direction>
            <Hash>{history[i].hash.slice(0, 4)}…{history[i].hash.slice(-4)}</Hash>
          </Section>
          <Section>
            <Amount>{this.getDisplayAmount(history[i].value)} {this.props.token}</Amount>
            <Status>{history[i].status}</Status>
          </Section>
        </Item>,
      );
    }
    return (
      <View>
        {transactionHistoryList.reverse()}
      </View>
    );
  }

  render() {
    const { animFadeIn } = this.state;
    return (
      <Animated.View style={[styles.container, { opacity: animFadeIn }]}>
        <Text style={styles.header} >activity</Text>
        {this.generateTransactionHistoryList(this.props.history)}
      </Animated.View>
    );
  }
}
