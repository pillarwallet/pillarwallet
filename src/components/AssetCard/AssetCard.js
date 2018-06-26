// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
  Image,
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
  color: string,
  onPress: Function,
  address: string,
  children?: React.Node,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
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
  cardBackgroundUri: string,
}

// function cacheImages(images) {
//   return images.map(image => {
//     if (typeof image === 'string') {
//       return Image.prefetch(image);
//     } else {
//       return Asset.fromModule(image).downloadAsync();
//     }
//   });
// }

const tokenPNGIcons = {};

tokenPNGIcons.ETH = require('assets/images/tokens/ETH/ETH.png');
tokenPNGIcons.PLR = require('assets/images/tokens/PLR/PLR.png');
tokenPNGIcons.QTM = require('assets/images/tokens/QTM/QTUM.png');
tokenPNGIcons.OMG = require('assets/images/tokens/OMG/OMG.png');
tokenPNGIcons.ICX = require('assets/images/tokens/ICX/ICX.png');
tokenPNGIcons.STORJ = require('assets/images/tokens/STORJ/icon.png');
tokenPNGIcons.BAT = require('assets/images/tokens/BAT/BAT.png');
tokenPNGIcons.GNT = require('assets/images/tokens/GNT/GNT.png');
tokenPNGIcons.PPT = require('assets/images/tokens/PPT/PPT.png');
tokenPNGIcons.SALT = require('assets/images/tokens/SALT/SALT.png');

export default class AssetCard extends React.Component<Props, State> {
  state = {
    cardBackgroundUri: '',
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.backgroundUri !== prevState.cardBackgroundUri) {
      return {
        cardBackgroundUri: nextProps.backgroundUri,
      };
    }

    return null;
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
              <ImageCache
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
                transitionDuration={0}
              />
              <DetailsWrapper>
                <Name>{name}</Name>
                <Amount>{amount}<AmountToken> {token}</AmountToken></Amount>
                <FiatAmount>
                  {currencySymbol}{balanceInFiat.amount}
                </FiatAmount>
              </DetailsWrapper>
              {!!tokenPNGIcons[token] &&
              <IconWrapper>
                <IconCircle />
                <Image
                  style={{
                    alignSelf: 'flex-end',
                    height: 24,
                    width: 24,
                    position: 'absolute',
                    top: 28,
                    right: 28,
                  }}
                  source={tokenPNGIcons[token]}
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
