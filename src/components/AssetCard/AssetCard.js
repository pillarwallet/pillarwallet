// @flow
import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol } from 'utils/common';
import { spacing, fontSizes, fontTrackings } from 'utils/variables';

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

const Amount = styled(LightText)`
  font-size: ${fontSizes.extraLarge};
  line-height: ${fontSizes.extraLarge};
  color: #fff;
`;

const FiatAmount = styled(LightText)`
  font-size: 14px;
  line-height: 14px;
  color: #fff;
  position: absolute;
  bottom: 20px;
  left: 14px;
`;

const AmountToken = styled(BoldText)`
  font-size: ${fontSizes.medium};
  line-height: ${fontSizes.extraLarge};
  color: #fff;
`;


const DetailsWrapper = styled.View`
  flex: 3;
  justify-content: flex-start;
  flex-direction: column;
`;


const IconCircle = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
  position: relative;
  align-self: flex-end;
  margin-top: 20px;
  margin-right: 14px;
  align-items: center;
  justify-content: center;
`;

const IconWrapper = styled.View`
  flex: 1;
`;


const Name = styled(BoldText)`
  font-size: ${fontSizes.mediumLarge};
  letter-spacing: ${fontTrackings.medium};
  line-height: ${fontSizes.mediumLarge};
  margin: 20px 0 0 14px;
  color: white;
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
          marginBottom: spacing.rhythm / 2,
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
