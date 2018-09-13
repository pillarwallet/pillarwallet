// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol } from 'utils/common';
import { spacing, fontSizes, fontTrackings, baseColors, UIColors } from 'utils/variables';

type Props = {
  id: string,
  name: string,
  token: string,
  amount: string,
  onPress: Function,
  address: string,
  wallpaper: string,
  children?: React.Node,
  disclaimer?: string,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  icon: string,
}

const defaultCircleColor = '#ACBCCD';

const AssetOutter = styled.View`
  padding: ${Platform.select({
    ios: `15px 9px 15px ${spacing.rhythm}px`,
    android: `3px 9px 27px ${spacing.rhythm}px`,
  })}
`;

const AssetWrapper = styled.View`
  margin: ${Platform.select({
    ios: `3px ${spacing.rhythm / 2}px 5px`,
    android: `2px ${spacing.rhythm / 2}px 6px`,
  })}
  flex-direction: row;
  shadow-color: ${UIColors.cardShadowColor};
  shadow-offset: 0 3px;
  shadow-opacity: 1;
  shadow-radius: 6px;
  elevation: 2;
  border-radius: 6px;
  background: ${baseColors.white};
  height: 70px;
`;

const InnerWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px 16px 15px 12px; 
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
`;

const AmountWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  flex: 1;
`;

const TokenAmountWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: baseline;
  align-self: flex-end;
  margin: 4px 0;
`;

const Amount = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
  color: ${baseColors.slateBlack};
`;

const FiatAmount = styled(LightText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  line-height: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.darkGray};
  align-self: flex-end;
  text-align: right;
`;

const Disclaimer = styled(LightText)`
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.small};
  color: ${baseColors.burningFire};
  align-self: flex-end;
  text-align: right;
`;

const AmountToken = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
  color: ${baseColors.slateBlack};
`;

const DetailsWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const IconCircle = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: ${props => props.color ? props.color : defaultCircleColor};
  margin-right: 22px;
  align-items: center;
  justify-content: center;
`;

const Name = styled(BoldText)`
  font-size: ${fontSizes.small};
  letter-spacing: ${fontTrackings.medium};
  line-height: ${fontSizes.medium};
  color: ${baseColors.slateBlack};
`;

const AssetCardSimplified = (props: Props) => {
  const {
    name,
    amount,
    token,
    balanceInFiat,
    onPress,
    disclaimer,
    icon = '',
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
  return (
    <AssetOutter>
      <AssetWrapper>
        <TouchableWithoutFeedback onPress={onPress}>
          <InnerWrapper>
            <IconCircle>
              {!!icon &&
              <CachedImage
                key={token}
                style={{
                  height: 44,
                  width: 44,
                }}
                source={{ uri: icon }}
                resizeMode="contain"
              />}
            </IconCircle>
            <DetailsWrapper>
              <Name>{name}</Name>
              <AmountWrapper>
                <TokenAmountWrapper>
                  <Amount>{amount}</Amount>
                  <AmountToken> {token}</AmountToken>
                </TokenAmountWrapper>
                {disclaimer
                  ? <Disclaimer>{disclaimer}</Disclaimer>
                  : <FiatAmount>{currencySymbol}{balanceInFiat.amount}</FiatAmount>
                }
              </AmountWrapper>
            </DetailsWrapper>
          </InnerWrapper>
        </TouchableWithoutFeedback>
      </AssetWrapper>
    </AssetOutter>
  );
};

export default AssetCardSimplified;
