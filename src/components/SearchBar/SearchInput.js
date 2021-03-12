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
import { TextInput as RNTextInput } from 'react-native';
import styled from 'styled-components/native';

// Components
import IconButton from 'components/IconButton';
import Input from 'components/Input';

// Utils
import { fontSizes, appFont } from 'utils/variables';

// Types
import type { TextInputProps } from 'utils/types/react-native';
import type { ThemeColors } from 'models/Theme';

export type InputPropsType = {|
  ...TextInputProps,
|};

export type IconProps = {|
  icon?: string,
  style?: Object,
  onPress?: () => void,
  persistIconOnFocus?: boolean,
|};
type Props = {|
  inputProps?: InputPropsType,
  placeholder?: string,
  backgroundColor?: string,
  inputRef?: React.ElementRef<typeof RNTextInput>,
  iconProps?: IconProps,
  isFocused: boolean,
  colors: ThemeColors,
  value: ?string,
  onFocus: () => void,
  onBlur: () => void,
  onChangeText: (input: string) => void,
  handleSubmit: () => void,
  borderColor: string,
|};

const SearchInput = ({
  inputProps,
  isFocused,
  colors,
  backgroundColor,
  value,
  placeholder,
  inputRef,
  onFocus,
  onChangeText,
  onBlur,
  handleSubmit,
  iconProps = {},
  borderColor,
}: Props) => {
  const {
    icon, style: iconStyle = {}, onPress, persistIconOnFocus,
  } = iconProps;
  const defaultOnIconPress = isFocused ? handleSubmit : onFocus;
  const onIconPress = onPress || defaultOnIconPress;
  const iconName = icon || 'search'; // eslint-disable-line i18next/no-literal-string
  const showIcon = persistIconOnFocus || !isFocused;

  return (
    <InputWrapper borderColor={borderColor} backgroundColor={backgroundColor}>
      <InputField
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
        value={value}
        onFocus={onFocus}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        underlineColorAndroid="transparent"
        ref={inputRef}
        needsExtraPadding={showIcon}
      />
      {showIcon && (
        <InputIcon
          icon={iconName}
          onPress={onIconPress}
          iconStyle={{
            width: 24,
            height: 24,
            color: colors.basic020,
            fontSize: 24,
            ...iconStyle,
          }}
        />
      )}
    </InputWrapper>
  );
};

export default SearchInput;

const InputField = styled(Input)`
  flex: 1;
  height: 42px;
  padding: 10px;
  padding-left: ${({ needsExtraPadding }) => (needsExtraPadding ? 40 : 14)}px;
  padding-right: 16px;
  color: ${({ theme }) => theme.colors.basic010};
  font-size: ${fontSizes.regular}px;
  font-family: '${appFont.regular}';
`;

const InputIcon = styled(IconButton)`
  flex: 0 0 20px;
  position: absolute;
  left: 10px;
  top: 7px;
`;

const InputWrapper = styled.View`
  height: 40px;
  border-width: 1px;
  border-color: ${({ borderColor }) => borderColor};
  border-radius: 20px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  width: 100%;
`;
