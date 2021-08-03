// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import SwipeButton from 'rn-swipe-button';

// types
import type { ViewStyleProp, TextStyleProp } from 'utils/types/react-native';

type Props = {|
  width?: number | string,
  height?: number,
  disabled?: boolean,
  title?: string,
  titleColor?: string,
  titleStyles?: TextStyleProp,
  titleFontSize?: number,
  containerStyles?: ViewStyleProp,
  railBorderColor?: string,
  railBackgroundColor?: string,
  railFillBorderColor?: string,
  railFillBackgroundColor?: string,
  railStyles?: ViewStyleProp,
  thumbIconComponent?: React.ComponentType<mixed>,
  thumbIconImageSource?: string,
  thumbIconStyles?: ViewStyleProp,
  thumbIconWidth?: number,
  thumbIconBorderColor?: string,
  thumbIconBackgroundColor?: string,
  compact?: boolean,
  onSwipeSuccess: () => mixed,
|};

function SwiperButton({
  width,
  height,
  disabled,
  title,
  titleColor,
  titleStyles,
  titleFontSize,
  containerStyles,
  railBorderColor,
  railBackgroundColor,
  railFillBorderColor,
  railFillBackgroundColor,
  railStyles,
  thumbIconComponent,
  thumbIconImageSource,
  thumbIconStyles,
  thumbIconWidth,
  thumbIconBorderColor,
  thumbIconBackgroundColor,
  compact,
  onSwipeSuccess,
}: Props) {
  return (
    <SwipeButtonContainer
      width={width}
      height={height}
      disabled={disabled}
      title={title}
      titleFontSize={titleFontSize}
      titleStyles={titleStyles}
      titleColor={titleColor}
      containerStyles={containerStyles}
      railBorderColor={railBorderColor}
      railFillBorderColor={railFillBorderColor}
      railFillBackgroundColor={railFillBackgroundColor}
      railBackgroundColor={railBackgroundColor}
      railStyles={railStyles}
      thumbIconComponent={thumbIconComponent}
      thumbIconImageSource={thumbIconImageSource}
      thumbIconStyles={thumbIconStyles}
      thumbIconWidth={thumbIconWidth}
      thumbIconBorderColor={thumbIconBorderColor}
      thumbIconBackgroundColor={thumbIconBackgroundColor}
      $compact={compact}
      onSwipeSuccess={onSwipeSuccess}
    />
  );
}

const SwipeButtonContainer = styled(SwipeButton)`
  justify-content: center;
  align-items: center;
  ${({ disabled }) => disabled && 'opacity: 0.5;'}
  ${({ $compact }) => !$compact && 'width: 100%;'}
`;

export default SwiperButton;
