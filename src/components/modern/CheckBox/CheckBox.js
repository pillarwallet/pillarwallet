/* eslint-disable no-unused-expressions */
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
import styled, { css } from 'styled-components/native';

// Constants
import { LIGHT_THEME } from 'constants/appSettingsConstants';

// Components
import Icon from 'components/Icon';

// Utils
import { getColorByTheme, useThemeColors } from 'utils/themes';
import { fontSizes, spacing } from 'utils/variables';

import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {
  value: boolean,
  onValueChange?: (value: boolean) => void,
  disabled?: boolean,
  style?: ViewStyleProp
};

const Checkbox = ({ value, onValueChange, disabled, style }: Props) => {
  const colors = useThemeColors();

  const handlePress = () => {
    if (disabled) return;

    onValueChange?.(!value);
  };

  return (
    <TouchableOpacity onPress={!disabled ? handlePress : null} disabled={disabled || !onValueChange} style={style}>
      <CheckboxWrapper disabled={disabled}>
        <CheckboxBox active={value} clickable={!disabled}>
          {!!value && (
            <Icon
              name="check"
              style={{
                color: colors.primary,
                fontSize: fontSizes.tiny,
              }}
            />
          )}
        </CheckboxBox>
      </CheckboxWrapper>
    </TouchableOpacity>
  );
};

export default Checkbox;

const CheckboxBox = styled.View`
  width: 24px;
  height: 24px;
  margin-right: ${spacing.mediumLarge}px;
  border-radius: ${({ rounded }) => (rounded ? 12 : 2)}px;
  flex: 0 0 24px;
  border-width: 1px;
  border-color: ${({ active }) =>
    active
      ? css`
          ${getColorByTheme({ lightKey: 'primaryAccent130', darkKey: 'basic090' })}
        `
      : css`
          ${getColorByTheme({ lightKey: 'basic080', darkKey: 'basic090' })}
        `};
  justify-content: center;
  align-items: center;
  background-color: ${getColorByTheme({ lightKey: 'basic070', darkKey: 'basic090' })};
  ${({ rounded, clickable, theme }) =>
    rounded && clickable && theme.current === LIGHT_THEME
      ? `
      shadow-color: #000000;
      shadow-radius: 3px;
      shadow-opacity: 0.15;
      shadow-offset: 0px 2px;
      elevation: 4;`
      : ''}
`;

const CheckboxWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`;
