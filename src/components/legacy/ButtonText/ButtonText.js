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
import { MediumText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';
import Spinner from 'components/Spinner';
import type { IconProps } from 'components/legacy/Icon';
import { fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';

type CommonProps = {
  disabled?: boolean,
  isLoading?: boolean,
  textStyle?: Object,
};

type WrapperProps = CommonProps & {
  onPress?: () => void,
  wrapperStyle?: Object,
};

type TouchableProps = CommonProps & WrapperProps & {
  children: React.Node,
};

type ContentProps = CommonProps & {
  buttonText?: string,
  fontSize?: number,
  secondary?: boolean,
};

type Props = WrapperProps & ContentProps & {
  leftIconProps?: IconProps,
  rightIconProps?: IconProps,
};

const Wrapper = styled.View`
  align-self: center;
  margin: 0;
  flex-direction: row;
  align-items: center;
`;

const ButtonLabel = styled(MediumText)`
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.regular}px;
  color: ${({ secondary, theme }) => secondary ? theme.colors.secondaryText : theme.colors.link};
`;

const StyledIcon = styled(Icon)`
  ${({ isLeft }) => isLeft ? 'margin-right: 4px;' : 'margin-left: 4px;'}
  color: ${themedColors.primary};
`;

const Touchable = (props: TouchableProps) => {
  const {
    onPress,
    wrapperStyle,
    children,
    disabled,
  } = props;
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Wrapper style={wrapperStyle}>
          {children}
        </Wrapper>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      disabled={disabled}
      background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
    >
      <Wrapper style={wrapperStyle}>
        {children}
      </Wrapper>
    </TouchableNativeFeedback>
  );
};

const ButtonContent = (props: ContentProps) => {
  const {
    isLoading,
    buttonText,
    fontSize,
    secondary,
    textStyle,
  } = props;
  if (isLoading) {
    return <Spinner size={20} trackWidth={2} />;
  } else if (buttonText) {
    return <ButtonLabel fontSize={fontSize} secondary={secondary} style={textStyle}>{buttonText}</ButtonLabel>;
  }
  return null;
};

/**
 * @deprecated This compontent is considered legacy and should not be used in new code
 *
 * Use: components/core/Button `text` variant instead
 */
const ButtonText = (props: Props) => {
  const {
    buttonText,
    onPress,
    fontSize,
    wrapperStyle,
    leftIconProps,
    rightIconProps,
    secondary,
    disabled,
    isLoading,
    textStyle,
  } = props;

  return (
    <Touchable onPress={onPress} wrapperStyle={wrapperStyle} disabled={disabled || isLoading}>
      {!!leftIconProps && <StyledIcon {...leftIconProps} isLeft />}
      <ButtonContent buttonText={buttonText} fontSize={fontSize} secondary={secondary} textStyle={textStyle} />
      {!!rightIconProps && <StyledIcon {...rightIconProps} />}
    </Touchable>
  );
};

export default ButtonText;
