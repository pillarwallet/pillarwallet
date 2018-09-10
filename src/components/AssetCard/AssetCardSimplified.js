// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol } from 'utils/common';
import { spacing, fontSizes, fontTrackings, baseColors } from 'utils/variables';

type Props = {
  id: string,
  name: string,
  token: string,
  amount: string,
  onPress: Function,
  address: string,
  wallpaper: string,
  children?: React.Node,
  isListed: boolean,
  disclaimer?: string,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  icon: string,
}

const defaultCircleColor = '#ACBCCD';

const AssetWrapper = styled.View`
  margin: 6px ${spacing.rhythm / 2}px 10px ;
  flex-direction: row;
  shadow-color: #333;
  shadow-offset: 0 1px;
  shadow-opacity: 0.25;
  shadow-radius: 5px;
  elevation: 4;
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
  height: 70px;
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
  margin-right: 16px;
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
    isListed = true,
    disclaimer,
    icon = '',
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
  return (
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
            <Name isListed={isListed}>{name}</Name>
            <AmountWrapper>
              <TokenAmountWrapper>
                <Amount isListed={isListed}>{amount}</Amount>
                <AmountToken isListed={isListed}> {token}</AmountToken>
              </TokenAmountWrapper>
              {disclaimer
                ? <Disclaimer>{disclaimer}</Disclaimer>
                : <FiatAmount> {currencySymbol}{balanceInFiat.amount} </FiatAmount>
              }
            </AmountWrapper>
          </DetailsWrapper>
        </InnerWrapper>
      </TouchableWithoutFeedback>
    </AssetWrapper>
  );
};

export default AssetCardSimplified;
