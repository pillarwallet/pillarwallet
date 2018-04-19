// @flow
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import TXHistory from 'components/TXHistory';
import Icon from './Icon';
import Name from './Name';
import Amount from './Amount';
import Content from './Content';

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
    animCardWidth: any,
}

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
    height: '100%',
  },
  cardContent: {
    flex: 0.5,

  },
  cardHistory: {
    flex: 1,
  },
});

export default class AssetCard extends React.Component<Props, State> {
  state = {
    pressed: false,
    animCardHeight: new Animated.Value(180),
    animCardWidth: new Animated.Value(30),
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
  Animated.parallel([
    Animated.spring(
      this.state.animCardHeight,
      {
        toValue: 200,
      },
    ),
    Animated.spring(
      this.state.animCardWidth,
      {
        toValue: 20,
      },
    ),
  ]).start();
}

shrink = () => {
  Animated.parallel([
    Animated.spring(
      this.state.animCardHeight,
      {
        toValue: 180,
      },
    ),
    Animated.spring(
      this.state.animCardWidth,
      {
        toValue: 30,
      },
    ),
  ]).start();
  // this.setState({ TopBorderRadius: 5, BottomBorderRadius: 0 });
}

render() {
  const {
    animCardHeight,
    animCardWidth,
    pressed,
  } = this.state;

  return (
    <View>
      <TouchableWithoutFeedback onPress={this.onCardTap}>
        <Animated.View
          color={this.props.color}
          refs="card"
          style={[styles.card, {
 height: animCardHeight, marginLeft: animCardWidth, marginRight: animCardWidth, backgroundColor: this.props.color,
}]}
        >
          <Icon />
          <Name>{this.props.name}</Name>
          <Amount>{this.props.amount}</Amount>
        </Animated.View>
      </TouchableWithoutFeedback>

      {pressed && (
        <View style={styles.cardContainer}>
          <Content style={styles.cardContent} />
          <TXHistory style={styles.cardHistory} />
        </View>
      ) }
    </View>
  );
}
}
