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
  smallScreen?: boolean,
  extraSmall?: boolean,
}


const defaultCircleColor = '#ACBCCD';

const AssetWrapper = styled.View`
  width: 33.33333%;
  justify-content: center;
  align-items: center;
`;

const cardHeight = (smallScreen, extraSmall) => {
  if (smallScreen && extraSmall) {
    return 55;
  } else if (smallScreen) {
    return 70;
  } else if (extraSmall) {
    return 88;
  }
  return 105;
};

const ShadowHolder = styled.View`
  margin: ${Platform.select({
    ios: `4px ${spacing.rhythm / 4}px 6px`,
    android: `2px ${spacing.rhythm / 4}px 8px`,
  })}
  flex-direction: row;
  shadow-color: ${UIColors.cardShadowColor};
  shadow-offset: 0 3px;
  shadow-opacity: 1;
  shadow-radius: 6px;
  elevation: 4;
  border-radius: 6px;
  background: ${baseColors.white};
  height: ${props => cardHeight(props.smallScreen, props.extraSmall)}px;
`;

const InnerWrapper = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${props => props.smallScreen ? spacing.rhythm / 4 : spacing.rhythm / 2}px; 
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
`;

const AmountWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin-top: ${props => props.extraSmall ? 4 : spacing.rhythm / 2}px;
`;

const Amount = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
  color: ${baseColors.slateBlack};
  text-align: left;
`;

const FiatAmount = styled(LightText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  line-height: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.darkGray};
  text-align: left;
`;

const Disclaimer = styled(LightText)`
  font-size: ${props => props.smallScreen ? fontSizes.extraExtraSmall : fontSizes.extraSmall}px;
  line-height: ${props => props.smallScreen ? fontSizes.extraExtraSmall : fontSizes.extraSmall}px;
  color: ${baseColors.burningFire};
  text-align: left;
`;

const IconCircle = styled.View`
  width: ${props => props.smallScreen ? 20 : 36}px;
  height: ${props => props.smallScreen ? 20 : 36}px;
  border-radius: ${props => props.smallScreen ? 10 : 18}px;
  background: ${props => props.color ? props.color : defaultCircleColor};
  margin-right: ${props => props.smallScreen ? 4 : 6}px;
  align-items: center;
  justify-content: center;
`;

const Name = styled(BoldText)`
  font-size: ${props => props.smallScreen ? fontSizes.extraExtraSmall : fontSizes.extraSmall}px;
  letter-spacing: ${fontTrackings.small};
  line-height: ${fontSizes.small}px;
  color: ${baseColors.darkGray};
`;

const DetailWrapper = styled.View`
  margin-top: 2px;
`;

const AssetCardMinimized = (props: Props) => {
  const {
    amount,
    token,
    balanceInFiat,
    onPress,
    disclaimer,
    icon = '',
    extraSmall,
    smallScreen,
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
  return (
    <AssetWrapper>
      <ShadowHolder smallScreen={smallScreen} extraSmall={extraSmall}>
        <TouchableWithoutFeedback onPress={onPress}>
          <InnerWrapper smallScreen={smallScreen}>
            <CardRow>
              <IconCircle smallScreen={smallScreen}>
                {!!icon &&
                <CachedImage
                  key={token}
                  style={{
                    height: smallScreen ? 20 : 36,
                    width: smallScreen ? 20 : 36,
                  }}
                  source={{ uri: icon }}
                  resizeMode="contain"
                />}
              </IconCircle>
              <Name>{token}</Name>
            </CardRow>
            <CardRow>
              <AmountWrapper extraSmall={extraSmall}>
                <Amount>{amount}</Amount>
                {!extraSmall &&
                <DetailWrapper>
                  {disclaimer
                    ? <Disclaimer smallScreen={smallScreen}>{disclaimer}</Disclaimer>
                    : <FiatAmount>{currencySymbol}{balanceInFiat.amount}</FiatAmount>
                  }
                </DetailWrapper>}
              </AmountWrapper>
            </CardRow>
          </InnerWrapper>
        </TouchableWithoutFeedback>
      </ShadowHolder>
    </AssetWrapper>
  );
};

export default AssetCardMinimized;
