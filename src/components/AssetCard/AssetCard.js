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
import { Image } from 'react-native-expo-image-cache';

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
  color: string,
  onPress: Function,
  address: string,
  children?: React.Node,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  iconUri: string,
  backgroundUri: string,
}

const BackgroundHolder = styled(View)`
  flex: 1;
  flex-direction: row;
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  position: relative;
`;

type State = {
  showAsset: boolean;
  cardBackgroundUri: string,
  cardIconUri: string,
}

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}


export default class AssetCard extends React.Component<Props, State> {
  state = {
    showAsset: false,
    cardBackgroundUri: undefined,
    cardIconUri: undefined,
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.backgroundUri !== prevState.cardBackgroundUri) {
      return {
        cardBackgroundUri: nextProps.backgroundUri,
        cardIconUri: nextProps.iconUri,
        showAsset: true,
      };
    }

    return null;
  }

  handleBackgroundDownload = () => {
    this.setState({ showAsset: true });
  }

  render() {
    const {
      color: linearGradientColorStart,
      name,
      amount,
      token,
      balanceInFiat,
      onPress,
    } = this.props;

    const {
      cardBackgroundUri,
      cardIconUri,
    } = this.state;

    const currencySymbol = getCurrencySymbol(balanceInFiat.currency);

    return (
      <View
        style={{
          backgroundColor: baseColors.white,
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
            opacity: this.state.showAsset ? 1 : 0,
          }}
        >

          <Animated.View
            color={linearGradientColorStart}
            style={[{
              height: 120,
              marginBottom: 20,
            }]}
          >
            <BackgroundHolder>
              <Image
                style={{
                  width: '100%',
                  height: 200,
                  position: 'absolute',
                  display: 'flex',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                }}
                {... { uri: cardBackgroundUri }}
                resizeMode="cover"
                onLoad={this.handleBackgroundDownload}
                transitionDuration={0}
              />
              <DetailsWrapper>
                <Name>{name}</Name>
                <Amount>{amount}<AmountToken> {token}</AmountToken></Amount>
                <FiatAmount>
                  {currencySymbol}{balanceInFiat.amount}
                </FiatAmount>
              </DetailsWrapper>
              <IconWrapper>
                <IconCircle>
                  <Image
                    style={{
                      alignSelf: 'flex-end',
                      height: 24,
                      width: 24,
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      opacity: this.state.showAsset ? 1 : 0,
                    }}
                    {...{ uri: cardIconUri }}
                    resizeMode="cover"
                  />
                </IconCircle>
              </IconWrapper>
            </BackgroundHolder>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}
