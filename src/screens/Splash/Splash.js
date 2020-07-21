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
import Lottie from 'lottie-react-native';

import { images } from 'utils/images';
import { getDeviceHeight } from 'utils/common';
import type { Theme } from 'models/Theme';

type Props = {
  theme: Theme,
};

const BackgroundWrapper = styled.View`
  background-color: #00ff24;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  position: relative;
  height: 100%;
`;

const LogoWrapper = styled.View`
   position: absolute;
   left: 50%;
   top: 50%;
   margin-top: -28px;
   margin-left: -96px;
`;

const PatternImg = styled(CachedImage)`
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  align-self: ${({ top }) => top ? 'flex-start' : 'flex-end'};
`;

const animatedLogo = require('./animatedLogo.json');


const BIGGEST_PATTERN_HEIGHT = 270;
const SCREEN_HEIGHT = getDeviceHeight();
const LOGO_HEIGHT = 56;
const LOGO_SAFE_SPACE = 50;
const MAX_PATTERN_HEIGHT = (SCREEN_HEIGHT - LOGO_HEIGHT - LOGO_SAFE_SPACE) / 2;

const getResizePercentage = () => {
  return 1 - ((BIGGEST_PATTERN_HEIGHT - MAX_PATTERN_HEIGHT) / MAX_PATTERN_HEIGHT);
};

class Splash extends React.Component<Props> {
  animation: Lottie;

  componentDidMount() {
    this.animation.play();
  }

  render() {
    const { theme } = this.props;
    const { splashPatternTop, splashPatternBottom } = images(theme);
    const imgResizePercentage = BIGGEST_PATTERN_HEIGHT > MAX_PATTERN_HEIGHT ? getResizePercentage() : 1;

    return (
      <BackgroundWrapper>
        <PatternImg
          source={splashPatternTop}
          resizeMode="cover"
          height={BIGGEST_PATTERN_HEIGHT * imgResizePercentage}
          width={216 * imgResizePercentage}
          top
        />
        <PatternImg
          source={splashPatternBottom}
          resizeMode="cover"
          height={162 * imgResizePercentage}
          width={270 * imgResizePercentage}
        />
        <LogoWrapper>
          <Lottie
            ref={(animation) => {
              this.animation = animation;
            }}
            source={animatedLogo}
            style={{ width: 192, height: LOGO_HEIGHT }}
            loop
          />
        </LogoWrapper>
      </BackgroundWrapper>
    );
  }
}


export default Splash;
