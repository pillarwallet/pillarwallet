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
import { AnimatedSVGPath } from 'react-native-svg-animations';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';

// Components
import { MediumText, BaseText } from 'components/legacy/Typography';
import DynamicSizeImage from 'components/DynamicSizeImage';

// Utils
import { formatTokenValueWithoutSymbol } from 'utils/format';
import { fontSizes } from 'utils/variables';
import { useThemeColors, themedColors } from 'utils/themes';

// Types
import type { ViewStyleProp, ImageSource } from 'utils/types/react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH_WITH_SPACING = 111;

type Props = {
  fromValue: BigNumber,
  fromSymbol: string,
  toValue: BigNumber,
  toSymbol: string,
  toValueInFiat: string,
  imageSource: ?ImageSource,
  style?: ViewStyleProp,
};

function ExchangeScheme({ fromValue, fromSymbol, toValue, toSymbol, imageSource, toValueInFiat, style }: Props) {
  const colors = useThemeColors();
  const [valueFromWidth, setValueFromWidth] = React.useState(0);
  const [valueToWidth, setValueToWidth] = React.useState(0);

  const formattedFromValue = formatTokenValueWithoutSymbol(fromValue, fromSymbol);
  const formattedToValue = formatTokenValueWithoutSymbol(toValue, toSymbol);

  return (
    <Container style={style}>
      <ValueWrapper onLayout={(event) => setValueFromWidth(event.nativeEvent.layout.width)}>
        <ValueText>
          {formattedFromValue}
          <SymbolText> {fromSymbol}</SymbolText>
        </ValueText>
      </ValueWrapper>

      <LogoWrapper>
        {!!imageSource && <DynamicSizeImage imageSource={imageSource} fallbackWidth={72} fallbackHeight={50} />}

        {!!valueToWidth && (
          <ArrowHolder isLeft>
            <AnimatedSVGPath
              strokeColor={colors.exchangeScheme}
              duration={500}
              strokeWidth={2}
              height={112}
              width={SCREEN_WIDTH / 2}
              delay={0}
              d={getLeftArrowPath(valueToWidth)}
              loop={false}
            />
          </ArrowHolder>
        )}

        {!!valueFromWidth && (
          <ArrowHolder>
            <AnimatedSVGPath
              strokeColor={colors.exchangeScheme}
              duration={500}
              strokeWidth={2}
              height={112}
              width={SCREEN_WIDTH / 2}
              delay={0}
              d={getRightArrowPath(valueFromWidth)}
              loop={false}
            />
          </ArrowHolder>
        )}
      </LogoWrapper>

      <ValueWrapper onLayout={(event) => setValueToWidth(event.nativeEvent.layout.width)}>
        <ValueText>
          {formattedToValue}
          <SymbolText> {toSymbol}</SymbolText>
        </ValueText>
      </ValueWrapper>

      <BaseText secondary small>
        {toValueInFiat}
      </BaseText>
    </Container>
  );
}

export default ExchangeScheme;

const getRightArrowPath = (fromValueWith: number) => {
  const RIGHT_ARROW_TOP_X = (SCREEN_WIDTH / 2) - 58;
  const RIGHT_ARROW_START_X = fromValueWith / 2 < RIGHT_ARROW_TOP_X
    ? fromValueWith / 2
    : RIGHT_ARROW_TOP_X;

  const RIGHT_ARROW_SIDE_X = (SCREEN_WIDTH / 2) - 18;
  /* eslint-disable i18next/no-literal-string */
  return `
    M ${RIGHT_ARROW_START_X},1
    L ${RIGHT_ARROW_TOP_X},1
    C ${RIGHT_ARROW_TOP_X + 25},1 ${(SCREEN_WIDTH / 2) - 18},16 ${RIGHT_ARROW_SIDE_X},41
    L ${RIGHT_ARROW_SIDE_X},49
    C ${RIGHT_ARROW_SIDE_X},89 ${RIGHT_ARROW_TOP_X + 25},104 ${RIGHT_ARROW_TOP_X},104
    L ${IMAGE_WIDTH_WITH_SPACING / 2},104,
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 1},104
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 12},97
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 1},104
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 12},111
    `;
  /* eslint-enable i18next/no-literal-string */
};

const getLeftArrowPath = (toValueWith: number) => {
  const BEND_START_X = 58;
  const BEND_START_SAFE = BEND_START_X + 10; // so arrow would look better
  const _endX = (SCREEN_WIDTH / 2) - (toValueWith / 2);
  const END_X = _endX > BEND_START_SAFE ? _endX : BEND_START_SAFE;

  /* eslint-disable i18next/no-literal-string */
  return `
    M ${(SCREEN_WIDTH / 2) - (IMAGE_WIDTH_WITH_SPACING / 2)},1
    L ${BEND_START_X},1
    C 33,1 18,16 18,41
    L 18,49
    C 18,89 33,104 ${BEND_START_X},104
    L ${END_X},104
    L ${END_X - 1},104
    L ${END_X - 12},97
    L ${END_X - 1},104
    L ${END_X - 12},111`;
  /* eslint-enable i18next/no-literal-string */
};

const Container = styled.View`
  justify-content: flex-start;
  align-items: center;
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
  font-variant: tabular-nums;
`;

const SymbolText = styled(MediumText)`
  font-size: ${fontSizes.big}px;
  color: ${themedColors.secondaryText};
`;

const LogoWrapper = styled.View`
  width: 100%;
  height: 156px;
  justify-content: center;
  align-items: center;
  overflow: visible;
  position: relative;
`;

const ArrowHolder = styled.View`
  position: absolute;
  height: 112px;
  width: ${SCREEN_WIDTH / 2}px;
  ${({ isLeft }) =>
    isLeft
      ? `left: 0;
      top: 50%;`
      : `right: 0;
      bottom: 50%;
      margin-bottom: -9px;`}
`;
