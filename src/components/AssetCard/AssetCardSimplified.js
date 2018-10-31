// @flow
import * as React from 'react';
import { Platform, Dimensions } from 'react-native';
import isEqual from 'lodash.isequal';
import styled from 'styled-components/native';
import { LightText, BaseText, BoldText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
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
    ios: `8px 9px 10px ${spacing.rhythm}px`,
    android: '2px 0 6px 0',
  })};
  margin-top: ${Platform.select({
    ios: 0,
    android: '-10px',
  })};
  background-color: transparent;
  width: 100%;
`;

const AssetWrapper = styled.View`
  flex-direction: row;
  shadow-radius: 6px;
  border-radius: 6px;
  background: ${baseColors.white};
  height: 70px;
  width: 100%;
`;

const InnerWrapper = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${Platform.select({
    ios: '15px 16px 15px 12px',
    android: '15px 32px 15px 12px',
  })};
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
`;

const AmountWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
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

const Name = styled(BaseText)`
  font-size: ${fontSizes.medium};
  letter-spacing: ${fontTrackings.tiny};
  line-height: ${fontSizes.medium};
  color: ${baseColors.slateBlack};
  flex: 1;
  margin-top: 2px;
  text-align-vertical: center;
`;

const { width } = Dimensions.get('window');
const cardWidth = width - 20;

class AssetCardSimplified extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    return !isEqual(this.props, nextProps);
  }

  render() {
    const {
      name,
      amount,
      token,
      balanceInFiat,
      onPress,
      disclaimer,
      icon = '',
    } = this.props;

    const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
    return (
      <AssetOutter cardWidth={cardWidth}>
        <Shadow heightAndroid={70}>
          <TouchableWithoutFeedback onPress={onPress}>
            <AssetWrapper>
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
            </AssetWrapper>
          </TouchableWithoutFeedback>
        </Shadow>
      </AssetOutter>
    );
  }
}

export default AssetCardSimplified;
