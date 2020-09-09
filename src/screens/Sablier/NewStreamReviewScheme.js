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
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { AnimatedSVGPath } from 'react-native-svg-animations';
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import { Spacing } from 'components/Layout';
import ProfileImage from 'components/ProfileImage';
import { themedColors } from 'utils/themes';
import { getDeviceWidth } from 'utils/common';
import { lineHeights } from 'utils/variables';


type Props = {
  assetValue: string,
  assetSymbol: string,
  time: string,
  receiver: string,
  assetValueFiat: string,
};

type State = {
  valueFromWidth: number,
};

const RootWrapper = styled.View`
  align-items: center;
  width: 100%;
`;

const SablierLogo = styled(CachedImage)`
  width: 76px;
  height: 76px;
  align-self: center;
`;

const TimeIcon = styled(Icon)`
  font-size: 14px;
  color: ${themedColors.secondaryText};
`;

const TimeWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SablierWrapper = styled.View`
`;

const AmountWrapper = styled.View`
  align-items: center;
`;

const ContactWrapper = styled.View`
  align-items: center;
  padding: 0 20px;
`;

const LeftArrowHolder = styled.View`
  position: absolute;
  left: 0;
  top: 184px
`;

const RightArrowHolder = styled.View`
  position: absolute;
  right: 0;
  top: 29px;
`;

const sablierLogo = require('assets/icons/sablier.png');

const SCREEN_WIDTH = getDeviceWidth();
const IMAGE_WIDTH_WITH_SPACING = 136;

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
    L ${RIGHT_ARROW_SIDE_X},115
    C ${RIGHT_ARROW_SIDE_X},140 ${RIGHT_ARROW_TOP_X + 25},155 ${RIGHT_ARROW_TOP_X},155
    L ${IMAGE_WIDTH_WITH_SPACING / 2},155,
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 1},155
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 12},148
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 1},155
    L ${(IMAGE_WIDTH_WITH_SPACING / 2) + 12},162
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
    L 18,115
    C 18,140 33,155 ${BEND_START_X},155
    L ${END_X},155
    L ${END_X - 1},155
    L ${END_X - 12},148
    L ${END_X - 1},155
    L ${END_X - 12},162`;
  /* eslint-enable i18next/no-literal-string */
};

class NewStreamReviewScheme extends React.Component<Props, State> {
  state = {
    valueFromWidth: 0,
  };

  render() {
    const {
      assetValue, assetSymbol, time, receiver, assetValueFiat,
    } = this.props;
    return (
      <RootWrapper>
        <AmountWrapper
          onLayout={(event) => { this.setState({ valueFromWidth: event.nativeEvent.layout.width }); }}
        >
          <MediumText giant>
            {assetValue}
            <MediumText big secondary style={{ lineHeight: lineHeights.giant }}> {assetSymbol}</MediumText>
          </MediumText>
          <BaseText small secondary>{assetValueFiat}</BaseText>
        </AmountWrapper>
        <Spacing h={76} />
        <SablierWrapper>
          <SablierLogo source={sablierLogo} />
          <Spacing h={6} />
          <TimeWrapper>
            <TimeIcon name="pending" />
            <Spacing w={5} />
            <BaseText regular secondary>{time}</BaseText>
          </TimeWrapper>
        </SablierWrapper>
        <Spacing h={48} />
        <ContactWrapper>
          <ProfileImage
            userName={receiver}
            diameter={64}
            noShadow
            borderWidth={0}
          />
          <Spacing h={7} />
          <MediumText big>{receiver}</MediumText>
        </ContactWrapper>
        <LeftArrowHolder>
          <AnimatedSVGPath
            strokeColor="#dadce4"
            duration={500}
            strokeWidth={2}
            height={160}
            width={SCREEN_WIDTH / 2}
            delay={0}
            d={getLeftArrowPath(138)}
            loop={false}
          />
        </LeftArrowHolder>
        <RightArrowHolder>
          <AnimatedSVGPath
            strokeColor="#dadce4"
            duration={500}
            strokeWidth={2}
            height={160}
            width={SCREEN_WIDTH / 2}
            delay={0}
            d={getRightArrowPath(this.state.valueFromWidth + 40)}
            loop={false}
          />
        </RightArrowHolder>
      </RootWrapper>
    );
  }
}

export default NewStreamReviewScheme;
