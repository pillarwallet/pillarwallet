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

import React, { useEffect, useRef } from 'react';
import type { Node as ReactNode } from 'react';
import { Dimensions, Animated } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';

import { UIColors, spacing } from 'utils/variables';

type Props = {|
  children?: ReactNode,
  isVisible?: boolean,
|};

const Wrapper = styled(SafeAreaView)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`;

const Box = Animated.createAnimatedComponent(styled.View`
  background-color: ${UIColors.tooltipBackground};
  margin-horizontal: ${spacing.layoutSides}px;
  margin-bottom: ${spacing.layoutSides}px;
  border-radius: 16px;
  padding: 16px;
`);

const getHideOffset = () => Dimensions.get('window').height;

const FloatingBox = ({ children, isVisible = true }: Props) => {
  const offsetVar = useRef(new Animated.Value(isVisible ? 0 : getHideOffset())).current;

  useEffect(() => {
    Animated.spring(offsetVar, {
      toValue: isVisible ? 0 : getHideOffset(),
      speed: 6,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [isVisible, offsetVar]);

  return (
    <Wrapper forceInset={{ bottom: 'always', top: 'never' }}>
      <Box style={{ transform: [{ translateY: offsetVar }] }}>
        {children}
      </Box>
    </Wrapper>
  );
};

export default FloatingBox;
