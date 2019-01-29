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
import { Platform, Dimensions } from 'react-native';
import isEqual from 'lodash.isequal';
import styled from 'styled-components/native';
import { BoldText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import { CachedImage } from 'react-native-cached-image';
import { spacing, fontSizes, fontTrackings, baseColors } from 'utils/variables';
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
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  icon: string,
  assetData: Object,
}

const defaultCircleColor = '#ACBCCD';
const genericToken = require('assets/images/tokens/genericToken.png');

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
  letter-spacing: ${fontTrackings.small};
  line-height: ${fontSizes.medium};
  color: ${baseColors.slateBlack};
  flex: 1;
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
    } = this.props;

    return (
      <AssetOutter cardWidth={cardWidth}>
        <Shadow heightAndroid={70} widthIOS={cardWidth - 20} heightIOS={70}>
          <TouchableWithoutFeedback onPress={this.handleOnPress}>
            <AssetWrapper>
              <InnerWrapper>
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
                  <Name>{name}</Name>
                  <AssetInfo
                    token={token}
                    amount={amount}
                    disclaimer={disclaimer}
                    balanceInFiat={balanceInFiat}
                  />
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
