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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';
import Icon, { IconName } from 'components/core/Icon';

// Utils
import { fontStyles, appFont, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// Types
import type { ViewStyleProp, TextStyleProp } from 'utils/types/react-native';
import type { ThemeColors } from 'models/Theme';

type Variant = 'primary' | 'secondary' | 'text' | 'destructive';

type Size = 'regular' | 'large' | 'compact';

type Props = {
  title?: string;
  leftIcon?: IconName;
  onPress?: () => any;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyleProp;
  titleColor?: string;
  titleStyle?: TextStyleProp;
  leftIconStyle?: ViewStyleProp;
};

function Button({
  title,
  leftIcon,
  onPress,
  variant = 'primary',
  size = 'regular',
  disabled,
  style,
  titleColor,
  titleStyle,
  leftIconStyle,
}: Props) {
  const [localDisabled, setLocalDisabled] = React.useState(false);
  const colors = useThemeColors();

  // Debounce press event
  const handlePress = () => {
    setLocalDisabled(true);

    setTimeout(() => {
      setLocalDisabled(false);
    }, 300);

    onPress?.();
  };

  if (!titleColor) {
    titleColor = getTitleColor(colors, variant);
  }

  return (
    <TouchableContainer
      onPress={handlePress}
      disabled={disabled || localDisabled}
      style={style}
      $variant={variant}
      $size={size}
    >
      {leftIcon && <LeftIcon name={leftIcon} color={titleColor} style={leftIconStyle} />}

      <Title $size={size} color={titleColor} style={titleStyle}>
        {title}
      </Title>
    </TouchableContainer>
  );
}

export default Button;

const getTitleColor = (colors: ThemeColors, variant: Variant): string => {
  switch (variant) {
    case 'primary':
      return colors.buttonPrimaryTitle;
    case 'secondary':
      return colors.buttonSecondaryTitle;
    case 'text':
      return colors.buttonTextTitle;
    case 'destructive':
      return colors.negative;
    default:
      return colors.text;
  }
};

const TouchableContainer = styled(TouchableOpacity)`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
  ${({ disabled }) => disabled && 'opacity: 0.5;'}
  ${({ $size }) => $size === 'regular' && `width: 100%; height: 72px; padding: 14px ${spacing.large}px`}
  ${({ $size }) =>
    $size === 'large' &&
    `width: 100%; height: 72px;
    padding:${spacing.largePlus}px ${spacing.large}px; border-radius: 14px;`}
  ${({ $size }) => $size === 'compact' && `padding: 6px ${spacing.medium}px;`}
  ${({ theme, $variant }) => $variant === 'primary' && `background-color: ${theme.colors.buttonPrimaryBackground}`};
  ${({ theme, $variant }) => $variant === 'secondary' && `background-color: ${theme.colors.buttonSecondaryBackground};`}
`;

const Title = styled(Text)`
  ${fontStyles.medium};
  ${({ $size }) => $size === 'large' && `font-family: ${appFont.medium}`};
`;

const LeftIcon = styled(Icon)``;
