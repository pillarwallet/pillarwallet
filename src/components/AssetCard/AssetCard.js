// @flow
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Icon from './Icon';
import Name from './Name';
import Amount from './Amount';

import TXHistory from '../TXHistory/TXHistory';
import AssetCardContent from './AssetCardContent';

type Props = {
  name: string,
  amount: number,
  color: string,
  onTap: any,
  tag: any,
}

type State = {
    pressed: any,
    animCardHeight: any,
}

// const {
//   width,
//   height,
// } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  cardContainer: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    height: 200,

  },
  cardHistory: {
    flex: 1,
  },
});

export default class AssetCard extends React.Component<Props, State> {
  state = {
    pressed: false,
    animCardHeight: new Animated.Value(180),
  };

  onCardTap = () => {
    this.props.onTap(this.props.tag);

    this.setState({
      pressed: !this.state.pressed,
    }, () => {
      if (this.state.pressed === true) {
        this.grow();
      } else {
        this.shrink();
      }
    });
  }

grow = () => {
  // this.setState({ TopBorderRadius: 0, BottomBorderRadius: 5 });
  Animated.spring(
    this.state.animCardHeight,
    {
      toValue: 200,

    },
  ).start();
}

shrink = () => {
  Animated.timing(
    this.state.animCardHeight,
    {
      toValue: 180,
      duration: 200,
    },
  ).start();
  // this.setState({ TopBorderRadius: 5, BottomBorderRadius: 0 });
}

render() {
  const { animCardHeight, pressed } = this.state;
  return (
    <View>
      <TouchableWithoutFeedback onPress={this.onCardTap}>
        <Animated.View
          color={this.props.color}
          refs="card"
          style={[styles.card, { height: animCardHeight, backgroundColor: this.props.color }]}
        >
          <Icon />
          <Name>{this.props.name}</Name>
          <Amount>{this.props.amount}</Amount>
        </Animated.View>
      </TouchableWithoutFeedback>

      {pressed && (
        <View style={styles.cardContainer}>
          <AssetCardContent style={styles.cardContent} />
          <TXHistory style={styles.cardHistory} />
        </View>
      ) }
    </View>
  );
}
}

