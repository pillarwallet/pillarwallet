// @flow
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { lighten } from 'polished';
import type { Transaction } from 'models/Transaction'
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
  onTap: Function,
  tag: string,
  address: string,
  history: Transaction[],
  children?: React.Node
}

type State = {
  isActive: boolean,
  animCardHeight: number,
  animCardWidth: any,
  animCardContentFade: any
}

const iconETH = require('assets/tokens/ETH/icon-ETH.png');

export default class AssetCard extends React.Component<Props, State> {
  state = {
    isActive: false,
    animCardHeight: new Animated.Value(140),
    animCardWidth: new Animated.Value(30),
    animCardContentFade: new Animated.Value(0),
  };

  onCardTap = () => {
    const { onTap, tag } = this.props
    this.setState({
      isActive: !this.state.isActive,
    }, () => {
      this.animateCardActiveState(this.state.isActive);
      onTap(tag);
    });
  };

  animateCardActiveState = (isActive: boolean) => {
    const cardHeightValue = isActive ? 200 : 140;
    const cardWidthValue = isActive ? 20 : 30;
    const cardContentFadeValue = isActive ? 1 : 0;
    Animated.parallel([
      Animated.spring(this.state.animCardHeight, {
        toValue: cardHeightValue,
      }),
      Animated.spring(this.state.animCardWidth, {
        toValue: cardWidthValue,
      }),
      Animated.spring(this.state.animCardContentFade, {
        toValue: cardContentFadeValue,
      }),
    ]).start();
  };

  render() {
    const {
      animCardHeight,
      animCardWidth,
      animCardContentFade,
      isActive,
    } = this.state;
    const {
      color: linearGradientColorStart,
      name,
      amount,
      token,
      children,
    } = this.props;
    const linearGradientColorEnd = lighten(0.2, linearGradientColorStart);

    return (
      <View>
        <TouchableWithoutFeedback onPress={this.onCardTap}>
          <Animated.View
            color={linearGradientColorStart}
            style={[{
              height: animCardHeight,
              marginLeft: animCardWidth,
              marginRight: animCardWidth,
            }]}
          >
            <Background colors={[linearGradientColorStart, linearGradientColorEnd]} start={[0, 1]} end={[1, 0]}>
              <DetailsWrapper>
                <Name>{name}</Name>
                <Amount>{amount}<AmountToken> {token}</AmountToken></Amount>
              </DetailsWrapper>
              <IconWrapper>
                <Icon source={iconETH} />
              </IconWrapper>
            </Background>
          </Animated.View>
        </TouchableWithoutFeedback>
        <Animated.View style={{ opacity: animCardContentFade }}>
          <Content>{children}</Content>
          <TXHistory
            address={this.props.address}
            history={this.props.history}
            token={this.props.token}
          />
        </Animated.View>
      </View>
    );
  }
}
