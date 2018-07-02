// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { baseColors } from 'utils/variables';
import { getCurrencySymbol } from 'utils/common';
import styled from 'styled-components/native';
import { Image as ImageCache } from 'react-native-expo-image-cache';

import IconWrapper from './IconWrapper';
import IconCircle from './IconCircle';
import DetailsWrapper from './DetailsWrapper';
import Name from './Name';
import { Amount, AmountToken, FiatAmount } from './Amount';

type Props = {
  id: string,
  name: string,
  token: string,
  amount: string,
  onPress: Function,
  address: string,
  children?: React.Node,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  icon: string,
  color: string
}

const BackgroundHolder = styled.View`
  flex: 1;
  flex-direction: row;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  position: relative;
  background-color: ${props => (props.cardColor)};
`;

const AmountWrapper = styled.View`
  height: 40;
  flex-wrap: wrap;
  margin-top: 10px;
  margin-left: 14px;
  justify-content: flex-end;
`;

type State = {
  cardIcon: string,
}

const defaultCardColor = '#ACBCCD';

export default class AssetCard extends React.Component<Props, State> {
  state = {
    cardIcon: '',
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.icon !== prevState.cardIcon) {
      return {
        cardIcon: nextProps.icon,
      };
    }

    return null;
  }

  render() {
    const {
      color,
      name,
      amount,
      token,
      balanceInFiat,
      onPress,
    } = this.props;

    const { cardIcon } = this.state;

    const currencySymbol = getCurrencySymbol(balanceInFiat.currency);

    return (
      <View
        style={{
          backgroundColor: baseColors.snowWhite,
        }}
      >
        <TouchableWithoutFeedback
          onPress={onPress}
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
            style={[{
              height: 130,
              marginBottom: 12,
            }]}
          >
            <BackgroundHolder cardColor={color || defaultCardColor}>
              <DetailsWrapper>
                <Name>{name}</Name>
                <AmountWrapper>
                  <Amount>{amount}</Amount>
                  <AmountToken> {token}</AmountToken>
                </AmountWrapper>
                <FiatAmount>
                  {currencySymbol}{balanceInFiat.amount}
                </FiatAmount>
              </DetailsWrapper>
              {!!cardIcon &&
              <IconWrapper>
                <IconCircle />
                <ImageCache
                  key={token}
                  style={{
                    alignSelf: 'flex-end',
                    height: 24,
                    width: 24,
                    position: 'absolute',
                    top: 27,
                    right: 22,
                  }}
                  uri={cardIcon}
                  resizeMode="contain"
                />
              </IconWrapper>}
            </BackgroundHolder>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}
