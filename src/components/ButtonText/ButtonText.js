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
import { Platform, TouchableOpacity, TouchableNativeFeedback } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import type { IconProps } from 'components/Icon';
import { fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';

type CommonProps = {
  onPress?: () => void,
  wrapperStyle?: Object,
}

type TouchableProps = CommonProps & {
  children: React.Node,
}

type Props = CommonProps & {
  buttonText: string,
  fontSize?: number,
  leftIconProps?: IconProps,
  rightIconProps?: IconProps,
}

const Wrapper = styled.View`
  align-self: center;
  margin: 0;
  flex-direction: row;
  align-items: center;
`;

const ButtonLabel = styled(BaseText)`
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.regular}px;
  color: ${themedColors.primary};
`;

const StyledIcon = styled(Icon)`
  ${({ isLeft }) => isLeft ? 'margin-right: 4px;' : 'margin-left: 4px;'}
  color: ${themedColors.primary};
`;

const Touchable = (props: TouchableProps) => {
  const { onPress, wrapperStyle, children } = props;
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity onPress={onPress}>
        <Wrapper style={wrapperStyle}>
          {children}
        </Wrapper>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
    >
      <Wrapper style={wrapperStyle}>
        {children}
      </Wrapper>
    </TouchableNativeFeedback>
  );
};

const ButtonText = (props: Props) => {
  const {
    buttonText,
    onPress,
    fontSize,
    wrapperStyle,
    leftIconProps,
    rightIconProps,
  } = props;

  return (
    <Touchable onPress={onPress} wrapperStyle={wrapperStyle}>
      {!!leftIconProps && <StyledIcon {...leftIconProps} isLeft />}
      <ButtonLabel fontSize={fontSize}>{buttonText}</ButtonLabel>
      {!!rightIconProps && <StyledIcon {...rightIconProps} />}
    </Touchable>
  );
};

export default ButtonText;
