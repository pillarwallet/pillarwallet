// @flow
import * as React from 'react';
import { Platform, View, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol } from 'utils/common';
import { fontSizes, fontTrackings, baseColors, fontWeights, spacing } from 'utils/variables';

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
  horizontalPadding?: boolean,
  innerCard?: boolean,
}

const AssetOutter = styled.View`
  width: 100%;
  padding-bottom: 6px;
  padding: ${Platform.select({
    ios: `10px ${spacing.mediumLarge}px`,
    android: 0,
  })}
`;

const defaultCardColor = '#ACBCCD';
const innerCardHeight = (Dimensions.get('window').width - 40) / 1.59; // 343X215 card size proportions

const AssetWrapper = styled.View`
  height: ${props => props.innerCard ? innerCardHeight : 140}px;
  border-radius: 20px;
  overflow: hidden;
  background-color: ${props => props.isListed ? defaultCardColor : baseColors.white}
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
`;

const BackgroundImage = styled(CachedImage)`
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 20px;
`;

const UpperRow = styled.View`
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  align-items: flex-start;
`;

const AmountWrapper = styled.View`
  margin-top: 10px;
  width: 100%;
  flex-direction: row;
`;

const Amount = styled(LightText)`
  font-size: ${fontSizes.extraLarge};
  line-height: ${fontSizes.extraLarge};
  color: ${props => props.isListed ? baseColors.white : baseColors.mediumGray};
  margin-right: ${props => props.innerCard ? '4px' : 0};
`;

const FiatAmount = styled(LightText)`
  font-size: ${fontSizes.extraSmall};
  line-height: 14px;
  color: #fff;
  margin-left: -2px;
  opacity: ${props => props.innerCard ? 0.7 : 1};
`;

const Disclaimer = styled(LightText)`
  font-size: ${fontSizes.extraSmall};
  line-height: 14px;
  color: ${baseColors.burningFire};
`;

const AmountToken = styled(LightText)`
  font-size: ${props => props.innerCard ? fontSizes.extraLarge : fontSizes.medium};
  font-weight: ${props => props.innerCard ? fontWeights.book : fontWeights.bold};
  line-height: ${fontSizes.extraLarge};
  color: ${props => props.isListed ? baseColors.white : baseColors.mediumGray};
`;


const DetailsWrapper = styled.View`
  justify-content: space-between;
  flex-direction: column;
  padding: ${props => props.innerCard ? '20px 24px 26px' : '20px'};
  flex: 1;
  height: 100%;
`;


const IconCircle = styled.View`
  width: ${props => props.innerCard ? 44 : 40}px;
  height: ${props => props.innerCard ? 44 : 40}px;
  border-radius: ${props => props.innerCard ? 22 : 20}px;
  background: ${props => props.isListed ? 'rgba(255,255,255,0.1)' : 'rgba(198,202,205,0.6)'};
  position: relative;
  margin-right: ${Platform.select({
    ios: 0,
    android: '16px',
  })};
  align-items: center;
  justify-content: center;
`;

const Name = styled(BoldText)`
  font-size: ${props => props.innerCard ? '34' : fontSizes.mediumLarge}px;
  margin-top: ${props => props.innerCard ? '5px' : 0};
  letter-spacing: ${fontTrackings.medium};
  line-height: ${props => props.innerCard ? '34' : fontSizes.mediumLarge};
  color: ${props => props.isListed ? baseColors.white : baseColors.mediumGray};
`;

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
    innerCard,
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
  const wallpaperUri = isListed ? wallpaper : undefined;
  return (
    <AssetOutter>
      <Shadow heightAndroid={innerCard ? innerCardHeight : 140}>
        <TouchableWithoutFeedback onPress={onPress}>
          <AssetWrapper innerCard={innerCard} isListed={isListed}>
            <BackgroundImage source={{ uri: wallpaperUri }} />
            <DetailsWrapper innerCard={innerCard}>
              <UpperRow>
                <Name isListed={isListed} innerCard={innerCard}>{name}</Name>
                {!!icon &&
                  <IconCircle isListed={isListed} innerCard={innerCard}>
                    <CachedImage
                      key={token}
                      style={{
                        height: 40,
                        width: 40,
                      }}
                      source={{ uri: icon }}
                      resizeMode="contain"
                    />
                  </IconCircle>}
              </UpperRow>
              <View style={{ flexDirection: 'column' }}>
                <AmountWrapper>
                  <Amount isListed={isListed} innerCard={innerCard}>{amount}</Amount>
                  <AmountToken isListed={isListed} innerCard={innerCard}>{token}</AmountToken>
                </AmountWrapper>
                <View style={{ marginTop: 8 }}>
                  {disclaimer
                    ? <Disclaimer>{disclaimer}</Disclaimer>
                    : <FiatAmount innerCard={innerCard}>{currencySymbol}{balanceInFiat.amount}</FiatAmount>
                  }
                </View>
              </View>
            </DetailsWrapper>
          </AssetWrapper>
        </TouchableWithoutFeedback>
      </Shadow>
    </AssetOutter>
  );
};

export default AssetCard;
