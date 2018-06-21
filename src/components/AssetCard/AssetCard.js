// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { baseColors } from 'utils/variables';
import { getCurrencySymbol } from 'utils/common';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/native';

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
`;

type State = {
  showAsset: boolean;
}

export default class AssetCard extends React.Component<Props, State> {
  state = {
    showAsset: false,
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
      iconUri,
      backgroundUri,
    } = this.props;
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
              <FastImage
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
                source={{
                  uri: backgroundUri,
                  priority: FastImage.priority.high,
                }}
                resizeMode={FastImage.resizeMode.cover}
                onLoad={this.handleBackgroundDownload}
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
                  <FastImage
                    style={{
                      alignSelf: 'flex-end',
                      height: 24,
                      width: 24,
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      opacity: this.state.showAsset ? 1 : 0,
                    }}
                    source={{
                      uri: iconUri,
                      priority: FastImage.priority.low,
                    }}
                    resizeMode={FastImage.resizeMode.cover}
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
