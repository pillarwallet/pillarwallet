// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Dimensions } from 'react-native';
import isEqual from 'lodash.isequal';
import styled from 'styled-components/native';
import { MediumText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import { CachedImage } from 'react-native-cached-image';
import { spacing, fontTrackings, baseColors, fontStyles } from 'utils/variables';
import AssetInfo from './AssetInfo';

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
  balanceInFiat: string,
  icon: string,
  assetData: Object,
  paymentNetworkBalance?: number,
  paymentNetworkBalanceFormatted?: string,
  paymentNetworkBalanceInFiat?: string,
}

const defaultCircleColor = '#ACBCCD';
const genericToken = require('assets/images/tokens/genericToken.png');

const AssetOutter = styled.View`
  padding: 8px 30px 10px ${spacing.rhythm}px;
  margin-top: 0;
  background-color: transparent;
  width: 100%;
`;

const AssetWrapper = styled.View`
  flex-direction: row;
  border-radius: 6px;
  background: ${baseColors.white};
  width: 100%;
  align-items: center;
  padding: 15px 16px;
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
  width: 100%;
`;

const DetailsWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 1;
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

const NameWrapper = styled.View`
  flex: 1;
  flex-wrap: wrap;
  padding-right: ${spacing.small}px;
`;

const Name = styled(MediumText)`
  ${fontStyles.medium};
  letter-spacing: ${fontTrackings.small};
  color: ${baseColors.text};
  text-align-vertical: center;
`;

const { width } = Dimensions.get('window');
const cardWidth = width - 20;

class AssetCardSimplified extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    return !isEqual(this.props, nextProps);
  }

  handleOnPress = () => {
    const { onPress, assetData } = this.props;
    onPress(assetData);
  };

  render() {
    const {
      name,
      amount,
      token,
      balanceInFiat,
      disclaimer,
      icon,
      paymentNetworkBalance,
      paymentNetworkBalanceFormatted,
      paymentNetworkBalanceInFiat,
    } = this.props;

    const cardHeight = paymentNetworkBalance ? 94 : 74;
    const balance = {
      value: amount,
      valueInFiat: balanceInFiat,
    };

    const balanceOnNetwork = paymentNetworkBalance ? {
      valueOnNetwork: paymentNetworkBalanceFormatted,
      valueOnNetworkInFiat: paymentNetworkBalanceInFiat,
    } : {};

    return (
      <AssetOutter cardWidth={cardWidth}>
        <Shadow
          heightAndroid={cardHeight}
          heightIOS={cardHeight}
          widthIOS={cardWidth - 20}
          widthAndroid={cardWidth - 20}
          useSVGShadow
          shadowOpacity={0.8}
        >
          <TouchableWithoutFeedback onPress={this.handleOnPress}>
            <AssetWrapper>
              <IconCircle>
                <CachedImage
                  key={token}
                  style={{
                    height: 44,
                    width: 44,
                  }}
                  source={{ uri: icon }}
                  fallbackSource={genericToken}
                  resizeMode="contain"
                />
              </IconCircle>
              <DetailsWrapper>
                <NameWrapper>
                  <Name
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {name}
                  </Name>
                </NameWrapper>
                <AssetInfo
                  token={token}
                  balance={balance}
                  balanceOnNetwork={balanceOnNetwork}
                  disclaimer={disclaimer}
                />
              </DetailsWrapper>
            </AssetWrapper>
          </TouchableWithoutFeedback>
        </Shadow>
      </AssetOutter>
    );
  }
}

export default AssetCardSimplified;
