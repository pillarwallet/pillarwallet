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
import styled from 'styled-components/native';
import { AnimatedSVGPath } from 'react-native-svg-animations';

// components
import { MediumText } from 'components/Typography';
import DynamicSizeImage from 'components/DynamicSizeImage';

// utils
import { fontSizes } from 'utils/variables';


type ImageObject = {
  uri: string,
}

type Props = {
  wrapperStyle?: Object,
  fromValue: number | string,
  fromAssetCode: string,
  toValue: number | string,
  toAssetCode: string,
  imageSource: ?string | ImageObject,
};

type State = {
  valueFromWidth: number,
  valueToWidth: number,
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH_WITH_SPACING = 111;

const SchemeWrapper = styled.View`
  justify-content: flex-start;
  align-items: center;
`;

const LogoWrapper = styled.View`
  width: 100%;
  height: 272px;
  justify-content: center;
  align-items: center;
  overflow: visible;
  position: relative;
`;

const ValueWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  padding: 0 34px;
  margin: 0 40px;
`;

const ValueText = styled(MediumText)`
  font-size: ${fontSizes.giant}px;
  text-align: center;
`;

const SymbolText = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const ArrowHolder = styled.View`
  position: absolute;
  height: 180px;
  width: ${SCREEN_WIDTH / 2}px;
  ${({ isLeft }) => isLeft
    ? `left: 0;
      top: 50%;
      margin-top: -9px;`
    : `right: 0;
      bottom: 50%;
      margin-bottom: -36px;`}
`;

const getRightArrowPath = (fromValueWith: number) => {
  const RIGHT_ARROW_TOP_X = (SCREEN_WIDTH / 2) - 58;
  const RIGHT_ARROW_START_X = fromValueWith / 2 < RIGHT_ARROW_TOP_X
    ? fromValueWith / 2
    : RIGHT_ARROW_TOP_X;

  const RIGHT_ARROW_SIDE_X = (SCREEN_WIDTH / 2) - 18;
  return `
    M ${RIGHT_ARROW_START_X},1
    L ${RIGHT_ARROW_TOP_X},1
    C ${RIGHT_ARROW_TOP_X + 25},1 ${(SCREEN_WIDTH / 2) - 18},16 ${RIGHT_ARROW_SIDE_X},41
    L ${RIGHT_ARROW_SIDE_X},96
    C ${RIGHT_ARROW_SIDE_X},121 ${RIGHT_ARROW_TOP_X + 25},136 ${RIGHT_ARROW_TOP_X},136
    L ${IMAGE_WIDTH_WITH_SPACING / 2},136,
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 1},136
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 12},129
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 1},136
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 12},143
    `;
};

const getLeftArrowPath = (toValueWith: number) => {
  const BEND_START_X = 58;
  const BEND_START_SAFE = BEND_START_X + 10; // so arrow would look better
  const _endX = (SCREEN_WIDTH / 2) - (toValueWith / 2);
  const END_X = _endX > BEND_START_SAFE ? _endX : BEND_START_SAFE;

  return `
    M ${(SCREEN_WIDTH / 2) - (IMAGE_WIDTH_WITH_SPACING / 2)},1
    L ${BEND_START_X},1
    C 33,1 18,16 18,41
    L 18,96
    C 18,121 33,136 ${BEND_START_X},136
    L ${END_X},136
    L ${END_X - 1},136
    L ${END_X - 12},129
    L ${END_X - 1},136
    L ${END_X - 12},143`;
};


class PoolTogetherPurchaseScheme extends React.Component<Props, State> {
  state = {
    valueFromWidth: 0,
    valueToWidth: 0,
  };

  render() {
    const { valueFromWidth, valueToWidth } = this.state;
    const {
      wrapperStyle,
      fromValue,
      fromAssetCode,
      toValue,
      toAssetCode,
      imageSource,
    } = this.props;

    return (
      <SchemeWrapper style={wrapperStyle}>
        <ValueWrapper
          onLayout={(event) => { this.setState({ valueFromWidth: event.nativeEvent.layout.width }); }}
          style={{ paddingTop: 18, marginBottom: -9 }}
        >
          <ValueText>
            {fromValue}
            <SymbolText> {fromAssetCode}</SymbolText>
          </ValueText>
        </ValueWrapper>
        <LogoWrapper>
          <DynamicSizeImage
            imageSource={imageSource}
            fallbackWidth={64}
            fallbackHeight={64}
          />
          <SymbolText style={{ paddingTop: 8 }}>Pool Together</SymbolText>
          {!!valueToWidth &&
          <ArrowHolder isLeft>
            <AnimatedSVGPath
              strokeColor="#dadce4"
              duration={500}
              strokeWidth={2}
              height={136}
              width={SCREEN_WIDTH / 2}
              delay={0}
              d={getLeftArrowPath(valueToWidth)}
              loop={false}
            />
          </ArrowHolder>}
          {!!valueFromWidth &&
          <ArrowHolder>
            <AnimatedSVGPath
              strokeColor="#dadce4"
              duration={500}
              strokeWidth={2}
              height={136}
              width={SCREEN_WIDTH / 2}
              delay={0}
              d={getRightArrowPath(valueFromWidth)}
              loop={false}
            />
          </ArrowHolder>}
        </LogoWrapper>
        <ValueWrapper
          onLayout={(event) => { this.setState({ valueToWidth: event.nativeEvent.layout.width }); }}
          style={{ marginTop: -34 }}
        >
          <ValueText>
            {toValue}
            <SymbolText> {toAssetCode}</SymbolText>
          </ValueText>
        </ValueWrapper>
      </SchemeWrapper>
    );
  }
}

export default PoolTogetherPurchaseScheme;
