// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { baseColors } from 'utils/variables';
import { lighten } from 'polished';
import type { Transaction } from 'models/Transaction';
import { getCurrencySymbol } from 'utils/common';
import IconImage from './IconImage';
import IconWrapper from './IconWrapper';
import Background from './Background';
import DetailsWrapper from './DetailsWrapper';
import Name from './Name';
import { Amount, AmountToken, FiatAmount } from './Amount';

type Props = {
  id: string,
  name: string,
  token: string,
  amount: string,
  color: string,
  onTap: Function,
  address: string,
  history: Transaction[],
  children?: React.Node,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
}

const iconETH = require('assets/tokens/ETH/icon-ETH.png');

const AssetCard = (props: Props) => {
  const {
    color: linearGradientColorStart,
    name,
    amount,
    token,
    balanceInFiat,
  } = props;
  const linearGradientColorEnd = lighten(0.2, linearGradientColorStart);
  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);

  return (
    <View
      style={{
        backgroundColor: baseColors.white,
      }}
    >


      <TouchableWithoutFeedback
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
    </View>
  );
};

export default AssetCard;
