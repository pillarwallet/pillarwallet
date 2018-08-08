// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol } from 'utils/common';
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
  onPress: Function,
  address: string,
  wallpaper: string,
  children?: React.Node,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  icon: string,
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

const BackgroundImage = styled(CachedImage)`
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

const AmountWrapper = styled.View`
  height: 40;
  flex-wrap: wrap;
  margin-top: 10px;
  margin-left: 14px;
  justify-content: flex-end;
`;

const defaultCardColor = '#ACBCCD';

const AssetCard = (props: Props) => {
  const {
    name,
    amount,
    token,
    balanceInFiat,
    onPress,
    wallpaper,
    icon = '',
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      style={{
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
        <BackgroundHolder cardColor={defaultCardColor}>
          <BackgroundImage source={{ uri: wallpaper }} />
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
          {!!icon &&
            <IconWrapper>
              <IconCircle>
                <CachedImage
                  key={token}
                  style={{
                    height: 40,
                    width: 40,
                  }}
                  source={{ uri: icon }}
                  resizeMode="contain"
                />
              </IconCircle>
            </IconWrapper>}
        </BackgroundHolder>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default AssetCard;
