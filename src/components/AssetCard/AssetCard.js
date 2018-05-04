// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { lighten } from 'polished';
import type { Transaction } from 'models/Transaction';
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
  id: string,
  activeCardId: string,
  isCardActive: boolean,
  name: string,
  index: number,
  token: string,
  amount: number,
  color: string,
  onTap: Function,
  defaultPositionY: number,
  address: string,
  history: Transaction[],
  children?: React.Node
}

type State = {
  isActive: boolean,
  animCardPosition: Animated.Value,
  animCardHeight: Animated.Value,
  animCardWidth: Animated.Value,
  animCardContentFade: Animated.Value,
  animCardOpacity: Animated.Value,
}

const iconETH = require('assets/tokens/ETH/icon-ETH.png');

export default class AssetCard extends React.Component<Props, State> {
  state = {
    isActive: false,
    animCardHeight: new Animated.Value(120),
    animCardWidth: new Animated.Value(30),
    animCardContentFade: new Animated.Value(0),
    animCardPosition: new Animated.Value(this.props.defaultPositionY),
    animCardOpacity: new Animated.Value(1),
  };

  handleCardTap = () => {
    const {
      onTap,
      defaultPositionY,
      id,
      activeCardId,
      isCardActive,
    } = this.props;

    let isActive = false;

    if (!isCardActive) {
      isActive = true;
    } else if (id === activeCardId) {
      isActive = false;
    }

    if (!(isCardActive && id !== activeCardId)) {
      this.setState({
        isActive,
      }, () => {
        this.animateCardActiveState(this.state.isActive);
        onTap(id, defaultPositionY);
      });
    }
  };

  isThereAnActiveCard: boolean = (this.props.activeCardId === this.props.id);

  animateCardActiveState = (isActive: boolean) => {
    const cardHeightValue = isActive ? 140 : 120;
    const cardWidthValue = isActive ? 20 : 30;
    const cardContentFadeValue = isActive ? 1 : 0;
    const cardPositionValue = isActive ? -60 : this.props.defaultPositionY;

    let cardOpacityValue = 1;

    console.log('animation begin', isActive);

    if (!this.props.isCardActive) {
      console.log('active card is false', !this.props.isCardActive);
      cardOpacityValue = 1;
    } else if (this.props.isCardActive && isActive) {
      cardOpacityValue = 1;
      console.log('active card is true and this card is active');
    } else if (this.props.isCardActive && this.props.activeCardId !== this.props.id) {
      cardOpacityValue = 0.5;
      console.log('active card is true, but it\'s not this card');
    }

    Animated.parallel([
      Animated.spring(this.state.animCardOpacity, {
        toValue: cardOpacityValue,
      }),
      Animated.spring(this.state.animCardPosition, {
        toValue: cardPositionValue,
      }),
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
      animCardPosition,
      animCardOpacity,
      isActive,
    } = this.state;
    const {
      color: linearGradientColorStart,
      name,
      amount,
      token,
      children,
      address,
      history,
    } = this.props;
    const linearGradientColorEnd = lighten(0.2, linearGradientColorStart);

    return (
      <View>
        <TouchableWithoutFeedback
          onPress={this.handleCardTap}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
          }}
        >
          <Animated.View
            color={linearGradientColorStart}
            style={[{
            height: animCardHeight,
            marginLeft: animCardWidth,
            marginRight: animCardWidth,
            marginBottom: 20,
            position: 'absolute',
            opacity: animCardOpacity,
            left: 0,
            right: 0,
            top: animCardPosition,
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

        {isActive && (
          <Animated.View
            style={{
              height: '100%',
              opacity: animCardContentFade,
              backgroundColor: '#FFFFFF',
              zIndex: -10,
            }}
          >
            {/* <Content>{children}</Content>
            <TXHistory
              address={address}
              history={history}
              token={token}
            /> */}
          </Animated.View>
        )}
      </View>
    );
  }
}
