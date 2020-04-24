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
import { CachedImage } from 'react-native-cached-image';

import { themedColors } from 'utils/themes';
import { spacing } from 'utils/variables';


type Props = {
  children: React.Node,
};

const { width: screenWidth } = Dimensions.get('window');

const StyledScrollView = styled.ScrollView`
  flex-grow: 1;
  background-color: ${themedColors.surface};
`;

const ContentWrapper = styled.View`
  position: relative;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px ${spacing.layoutSides}px;
`;

const Confetti = styled(CachedImage)`
  position: absolute;
  left: 0;
  ${({ top }) => top ? 'top: 0;' : 'bottom: 0;'}
  width: ${screenWidth}px;
  height: ${({ height }) => height}px;
`;

const confettiTop = require('assets/images/rewardBackgroundTop.png');
const confettiBottom = require('assets/images/rewardBackgroundBottom.png');


const ConfettiBackground = (props: Props) => {
  const { children } = props;
  return (
    <StyledScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ContentWrapper>
        <Confetti source={confettiTop} resizeMode="cover" top height={screenWidth * 0.73} />
        <Confetti source={confettiBottom} resizeMode="contain" height={screenWidth * 0.48} />
        {children}
      </ContentWrapper>
    </StyledScrollView>
  );
};


export default ConfettiBackground;
