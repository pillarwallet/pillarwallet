// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import styled from 'styled-components';
import { Icon } from 'native-base';
import { baseColors, fontWeights } from 'utils/variables';
import { lighten } from 'polished';
import type { Transaction } from 'models/Transaction';
import TXHistory from 'components/TXHistory';
import { getCurrencySymbol } from 'utils/common';
import IconImage from './IconImage';
import IconWrapper from './IconWrapper';
import Background from './Background';
import DetailsWrapper from './DetailsWrapper';
import Name from './Name';
import { Amount, AmountToken, FiatAmount } from './Amount';
import Content from './Content';

type Props = {
  id: string,
  activeCardId: string,
  isCardActive: boolean,
  name: string,
  token: string,
  amount: string,
  color: string,
  onTap: Function,
  defaultPositionY: number,
  address: string,
  history: Transaction[],
  children?: React.Node,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
}

type State = {
  isActive: boolean,
  animCardPosition: Animated.Value,
  animCardHeight: Animated.Value,
  animCardContentFade: Animated.Value,
}

const iconETH = require('assets/tokens/ETH/icon-ETH.png');

const CloseIcon = styled(Icon)`
  align-self: flex-end;
  margin-right: 30;
  color: ${baseColors.clearBlue};
  font-weight: ${fontWeights.bold};
`;

export default class AssetCard extends React.Component<Props, State> {
  state = {
    isActive: false,
    animCardHeight: new Animated.Value(120),
    animCardContentFade: new Animated.Value(0),
    animCardPosition: new Animated.Value(this.props.defaultPositionY),
  };

  handleCardTap = () => {
    const {
      onTap,
      defaultPositionY,
      id,
      activeCardId,
      isCardActive,
    } = this.props;

    if (!isCardActive || id === activeCardId) {
      this.setState({
        isActive: !this.state.isActive,
      }, () => {
        this.animateCardActiveState(this.state.isActive);
        onTap(id, defaultPositionY);
      });
    }
  };

  animateCardActiveState = (isActive: boolean) => {
    const cardHeightValue = isActive ? 140 : 120;
    const cardContentFadeValue = isActive ? 1 : 0;
    const cardPositionValue = isActive ? -60 : this.props.defaultPositionY;

    Animated.parallel([
      Animated.spring(this.state.animCardPosition, {
        toValue: cardPositionValue,
      }),
      Animated.spring(this.state.animCardHeight, {
        toValue: cardHeightValue,
      }),
      Animated.spring(this.state.animCardContentFade, {
        toValue: cardContentFadeValue,
      }),
    ]).start();
  };

  render() {
    const {
      animCardHeight,
      animCardContentFade,
      animCardPosition,
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
      balanceInFiat,
    } = this.props;
    const linearGradientColorEnd = lighten(0.2, linearGradientColorStart);
    const currencySymbol = getCurrencySymbol(balanceInFiat.currency);

    return (
      <View
        style={{
          backgroundColor: baseColors.white,
        }}
      >

        {isActive && (
          <Animated.View
            style={{
              position: 'relative',
              top: -110,
              opacity: animCardContentFade,
            }}
          >
            <CloseIcon
              name="md-close"
              onPress={this.handleCardTap}
            />
          </Animated.View>
        )}

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
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            position: 'absolute',
            left: 0,
            right: 0,
            top: animCardPosition,
          }]}
          >
            <Background colors={[linearGradientColorStart, linearGradientColorEnd]} start={[0, 1]} end={[1, 0]}>
              <DetailsWrapper>
                <Name>{name}</Name>
                <Amount>{amount}<AmountToken> {token}</AmountToken></Amount>
                <FiatAmount>
                  {currencySymbol}{balanceInFiat.amount}
                </FiatAmount>
              </DetailsWrapper>
              <IconWrapper>
                <IconImage source={iconETH} />
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
            <Content>{children}</Content>
            <TXHistory
              address={address}
              history={history}
              token={token}
            />
          </Animated.View>
        )}
      </View>
    );
  }
}
