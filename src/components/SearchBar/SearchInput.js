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
import { TextInput as RNTextInput } from 'react-native';
import IconButton from 'components/IconButton';
import TextInput from 'components/Input';

import { fontSizes, appFont } from 'utils/variables';

import type { ThemeColors } from 'models/Theme';
// $FlowFixMe
import type { Event } from 'react-native';

type Value = ?string;

type InputPropsType = {
  placeholder?: string,
  backgroundColor?: string,
  onChange: (Value) => void,
  onBlur?: (Value) => void,
  onFocus?: () => void,
  value: Value,
  validator?: (val: string) => string,
};

type IconProps = {|
  icon: string,
  style?: Object,
  onPress?: () => void,
  persistIconOnFocus?: boolean,
|};

export type CommonComponentsProps = {
  inputProps: InputPropsType,
  placeholder?: string,
  backgroundColor?: string,
  inputRef?: React.ElementRef<typeof RNTextInput>,
  inputIconName?: string,
  iconProps?: IconProps,
};


type SearchInputProps = CommonComponentsProps & {
  isFocused: boolean,
  colors: ThemeColors,
  value: ?string,
  onFocus: () => void,
  onChange: (e: Event) => void,
  onBlur: () => void,
  handleSubmit: () => void,
  borderColor: string,
};

const SearchInput = (props: SearchInputProps) => {
  const {
    inputProps,
    isFocused,
    colors,
    backgroundColor,
    value,
    placeholder,
    inputRef,
    onFocus,
    onChange,
    onBlur,
    handleSubmit,
    iconProps = {},
    borderColor,
  } = props;

  const { icon, style: iconStyle = {}, onPress, persistIconOnFocus } = iconProps;
  const defaultOnIconPress = isFocused ? handleSubmit : onFocus;
  const onIconPress = onPress || defaultOnIconPress;
  const iconName = icon || 'search'; // eslint-disable-line i18next/no-literal-string
  const showIcon = persistIconOnFocus || !isFocused;

  return (
    <InputWrapper borderColor={borderColor} backgroundColor={backgroundColor}>
      <InputField
        {...inputProps}
        onFocus={onFocus}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        underlineColorAndroid="transparent"
        autoCorrect={false}
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

const InputField = styled(TextInput)`
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
