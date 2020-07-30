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
import { TouchableOpacity } from 'react-native';
import { BaseText } from 'components/Typography';
import styled, { withTheme } from 'styled-components/native';
import { fontSizes, spacing, fontStyles } from 'utils/variables';
import Icon from 'components/Icon';
import { LIGHT_THEME, DARK_THEME } from 'constants/appSettingsConstants';
import type { Theme } from 'models/Theme';
import { getThemeColors, getThemeType } from 'utils/themes';


type Props = {
  text?: string,
  onPress?: () => void,
  disabled?: boolean,
  checked: boolean,
  children?: React.Node,
  wrapperStyle?: Object,
  rounded?: boolean,
  lightText?: boolean,
  small?: boolean,
  theme: Theme,
  positive?: boolean,
};

const getCheckboxBorderColor = (theme: Theme, active: boolean, positive: boolean, rounded: boolean) => {
  const colors = getThemeColors(theme);
  if (rounded || getThemeType(theme) === DARK_THEME) {
    return 'transparent';
  }
  if (active) {
    if (positive) return colors.positive;
    return colors.primary;
  }
  return colors.border;
};

const CheckboxBox = styled.View`
  width: 24;
  height: 24;
  margin-right: ${spacing.mediumLarge}px;
  border-radius: ${({ rounded }) => rounded ? 12 : 2}px;
  flex: 0 0 24px;
  border-width: 1px;
  border-color: ${({
    theme, active, positive, rounded,
  }) => getCheckboxBorderColor(theme, active, positive, rounded)};
  justify-content: center;
  align-items: center;
  ${({ rounded, theme }) => {
    if (rounded) {
      return `background-color: ${theme.colors.card}`;
    }
    if (getThemeType(theme) === DARK_THEME) {
      return `background-color: ${theme.colors.tertiary}`;
    }
    return '';
  }};
  ${({ rounded, clickable, theme }) => rounded && clickable && theme.current === LIGHT_THEME
    ? `
      shadow-color: #000000;
      shadow-radius: 3px;
      shadow-opacity: 0.15;
      shadow-offset: 0px 2px;
      elevation: 4;`
    : ''}
`;

const CheckboxText = styled(BaseText)`
  ${props => props.small ? fontStyles.regular : fontStyles.medium};
  color: ${({ light, theme }) => light ? theme.colors.accent : theme.colors.text};
  flex-wrap: wrap;
`;

const TextWrapper = styled.View`
  flex: 1;
  margin-top: 2px;
  flex-direction: row;
`;

const CheckboxWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const Checkbox = (props: Props) => {
  const {
    disabled,
    text,
    children,
    rounded,
    wrapperStyle,
    small,
    lightText,
    theme,
    checked,
    onPress,
    positive,
  } = props;

  const colors = getThemeColors(theme);

  return (
    <TouchableOpacity
      onPress={!disabled ? onPress : null}
      style={wrapperStyle}
      disabled={!onPress}
    >
      <CheckboxWrapper disabled={disabled}>
        <CheckboxBox active={checked} rounded={rounded} positive={positive} clickable={!disabled}>
          {!!checked &&
          <Icon
            name="check"
            style={{
              color: positive ? colors.positive : colors.primary,
              fontSize: fontSizes.tiny,
            }}
          />
          }
        </CheckboxBox>
        {!!text && <CheckboxText small={small} light={lightText}>{text}</CheckboxText>}
        {!!children &&
        <TextWrapper>
          <CheckboxText small={small} light={lightText}>{children}</CheckboxText>
        </TextWrapper>}
      </CheckboxWrapper>
    </TouchableOpacity>
  );
};

export default withTheme(Checkbox);
