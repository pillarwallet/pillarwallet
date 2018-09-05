// @flow
import * as React from 'react';
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
  isListed: boolean,
  disclaimer?: string,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  icon: string,
}

const AssetWrapper = styled.View`
  height: 130px;
  margin-bottom: ${spacing.rhythm / 2};
  width: 100%;
  box-shadow: 0px 1px 2px ${UIColors.defaultShadowColor};
  padding: 2px;
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
`;

const BackgroundHolder = styled.View`
  flex: 1;
  flex-direction: row;
  border-radius: 12px;
  height: 130px;
  border-radius: 20px;
  width: 100%;
  elevation: 2;
  position: relative;
  background-color: ${props => (props.cardColor)};
`;

const BackgroundImage = styled(CachedImage)`
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 20px;
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
  color: ${props => props.isListed ? baseColors.white : baseColors.mediumGray};
`;

const FiatAmount = styled(LightText)`
  font-size: 14px;
  line-height: 14px;
  color: #fff;
  position: absolute;
  bottom: 18px;
  left: 12px;
`;

const Disclaimer = styled(LightText)`
  font-size: 14px;
  line-height: 14px;
  color: ${baseColors.burningFire};
  position: relative;
  position: absolute;
  bottom: 18px;
  left: 14px;
`;

const AmountToken = styled(BoldText)`
  font-size: ${fontSizes.medium};
  line-height: ${fontSizes.extraLarge};
  color: ${props => props.isListed ? baseColors.white : baseColors.mediumGray};
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
  background: ${props => props.isListed ? 'rgba(255,255,255,0.1)' : 'rgba(198,202,205,0.6)'};
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
  color: ${props => props.isListed ? baseColors.white : baseColors.mediumGray};
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
    isListed = true,
    disclaimer,
    icon = '',
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
  const bgColor = isListed ? defaultCardColor : baseColors.white;
  const wallpaperUri = isListed ? wallpaper : undefined;
  return (
    <AssetWrapper>
      <TouchableWithoutFeedback onPress={onPress}>
        <BackgroundHolder cardColor={bgColor}>
          <BackgroundImage source={{ uri: wallpaperUri }} />
          <DetailsWrapper>
            <Name isListed={isListed}>{name}</Name>
            <AmountWrapper>
              <Amount isListed={isListed}>{amount}</Amount>
              <AmountToken isListed={isListed}> {token}</AmountToken>
            </AmountWrapper>
            {disclaimer
              ? <Disclaimer>{disclaimer}</Disclaimer>
              : <FiatAmount> {currencySymbol}{balanceInFiat.amount} </FiatAmount>
            }
          </DetailsWrapper>
          {!!icon &&
            <IconWrapper>
              <IconCircle isListed={isListed}>
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
      </TouchableWithoutFeedback>
    </AssetWrapper>
  );
};

export default AssetCard;
