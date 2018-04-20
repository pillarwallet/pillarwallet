// @flow
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { lighten } from 'polished';
import TXHistory from 'components/TXHistory';
import Icon from './Icon';
import IconWrapper from './IconWrapper';
import Background from './Background';
import DetailsWrapper from './DetailsWrapper';
import Name from './Name';
import Amount from './Amount';
import AmountToken from './AmountToken';
import Content from './Content';

type Props = {
  name: string,
  token: string,
  amount: number,
  color: string,
  onTap: any,
  tag: any,
  history: {}
}

type State = {
    pressed: any,
    animCardHeight: any,
    animCardWidth: any,
}

const styles = StyleSheet.create({
  cardContainer: {
  },
  cardContent: {
    flex: 0.5,

  },

});

export default class AssetCard extends React.Component<Props, State> {
  state = {
    pressed: false,
    animCardHeight: new Animated.Value(140),
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
        toValue: 140,
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

  const linearGradientColorStart = this.props.color;
  const linearGradientColorEnd = lighten(0.2, this.props.color);

  return (
    <View>
      <TouchableWithoutFeedback onPress={this.onCardTap}>
        <Animated.View
          color={this.props.color}
          refs="card"
          style={[{
            height: animCardHeight,
            marginLeft: animCardWidth,
            marginRight: animCardWidth,
          }]}
        >
          <Background colors={[linearGradientColorStart, linearGradientColorEnd]} start={[0, 1]} end={[1, 0]}>
            <DetailsWrapper>
              <Name>{this.props.name}</Name>
              <Amount>{this.props.amount} <AmountToken>{this.props.token}</AmountToken></Amount>
            </DetailsWrapper>
            <IconWrapper>
              <Icon source={require('assets/tokens/ETH/icon-ETH.png')} />
            </IconWrapper>
          </Background>
        </Animated.View>

      </TouchableWithoutFeedback>

      {pressed && (
        <View style={styles.cardContainer}>
          <Content style={styles.cardContent} />
          <TXHistory address={this.props.address} history={this.props.history} style={styles.cardHistory} token={this.props.token} />
        </View>
      ) }
    </View>
  );
}
}
