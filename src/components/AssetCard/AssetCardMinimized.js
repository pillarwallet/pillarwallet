// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol } from 'utils/common';
import { spacing, fontSizes, fontTrackings, baseColors } from 'utils/variables';

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
  extrasmall?: boolean,
}

const defaultCircleColor = '#ACBCCD';

const AssetWrapper = styled.View`
  width: 33.33333%;
  justify-content: center;
  align-items: center;
`;

const ShadowHolder = styled.View`
  margin: 4px ${spacing.rhythm / 4}px 6px ;
  flex-direction: row;
  shadow-color: #333;
  shadow-offset: 0 1px;
  shadow-opacity: 0.25;
  shadow-radius: 3px;
  elevation: 3;
  border-radius: 6px;
  background: ${baseColors.white};
  height: ${props => props.extrasmall ? 88 : 105}px;
`;

const InnerWrapper = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${spacing.rhythm / 2}px; 
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
  margin-top: ${props => props.extrasmall ? 4 : spacing.rhythm / 2}px;
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
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.small};
  color: ${baseColors.burningFire};
  text-align: left;
`;

const IconCircle = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: ${props => props.color ? props.color : defaultCircleColor};
  margin-right: ${spacing.rhythm / 2}px;
  align-items: center;
  justify-content: center;
`;

const Name = styled(BoldText)`
  font-size: ${fontSizes.extraSmall};
  letter-spacing: ${fontTrackings.small};
  line-height: ${fontSizes.small};
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
    extrasmall,
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
  return (
    <AssetWrapper>
      <ShadowHolder extrasmall={extrasmall}>
        <TouchableWithoutFeedback onPress={onPress}>
          <InnerWrapper>
            <CardRow>
              <IconCircle>
                {!!icon &&
                <CachedImage
                  key={token}
                  style={{
                    height: 40,
                    width: 40,
                  }}
                  source={{ uri: icon }}
                  resizeMode="contain"
                />}
              </IconCircle>
              <Name>{token}</Name>
            </CardRow>
            <CardRow>
              <AmountWrapper extrasmall={extrasmall}>
                <Amount>{amount}</Amount>
                {!extrasmall &&
                <DetailWrapper>
                  {disclaimer
                    ? <Disclaimer>{disclaimer}</Disclaimer>
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
