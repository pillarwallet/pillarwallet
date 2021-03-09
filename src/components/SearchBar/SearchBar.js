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
/* eslint-disable no-unused-expressions */

import * as React from 'react';
import { Keyboard, View } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import Clipboard from '@react-native-community/clipboard';
import t from 'translations/translate';

// Components
import { BaseText } from 'components/Typography';

// Utils
import { getColorByThemeOutsideStyled, getThemeType, useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { SyntheticEvent } from 'utils/types/react-native';

// Local
import SearchInput, { type CommonComponentsProps } from './SearchInput';


type Props = {|
  ...CommonComponentsProps,
  marginTop?: number,
  marginBottom?: number,
  showPasteButton?: boolean;
|};

const getBorderColor = ({
  isFocused, error, colors, defaultColor,
}) => {
  if (error) return colors.secondaryAccent240;
  if (isFocused) return colors.basic000;
  return defaultColor;
};

const SearchBar = ({
  inputProps,
  placeholder = t('label.search'),
  backgroundColor,
  marginTop,
  marginBottom,
  inputRef,
  showPasteButton,
  iconProps,
}: Props) => {
  const value = React.useRef('');

  const [isFocused, setIsFocused] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const theme = useTheme();
  const colors = useThemeColors();

  const validateInput = (input: string) => {
    const { validator } = inputProps;
    if (!validator) return;

    const error = validator(input);
    setErrorMessage(error);
  };

  const handleChange = (e: SyntheticEvent<any>) => {
    value.current = e.nativeEvent.text;
    inputProps.onChange?.(value.current);
    validateInput(value.current);
  };

  const handleFocus = () => {
    inputProps.onFocus?.();
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    inputProps.onBlur?.();
  };

  const handleCancel = () => {
    value.current = '';
    inputProps.onChange?.(value.current);

    Keyboard.dismiss();
    handleBlur();
  };

  const handlePaste = async () => {
    value.current = await Clipboard.getString();
    inputProps.onChange?.(value.current);
    validateInput(value.current);
  };

  const handleSubmit = () => {
    inputProps.onChange(inputProps.value);
  };

  const currentTheme = getThemeType(theme);
  const defaultInputBackgroundColor = getColorByThemeOutsideStyled(currentTheme, {
    lightKey: 'basic060',
    darkKey: 'basic080',
  });

  const borderColor = getBorderColor({
    isFocused,
    error: !!errorMessage,
    colors,
    defaultColor: defaultInputBackgroundColor,
  });

  const customInputProps = {
    inputProps,
    isFocused,
    colors,
    backgroundColor: backgroundColor || defaultInputBackgroundColor,
    value: inputProps.value,
    placeholder,
    inputRef,
    onFocus: handleFocus,
    onChange: handleChange,
    onBlur: handleBlur,
    handleSubmit,
    borderColor,
  };

  const showCancelButton = isFocused || !!inputProps.value;

  return (
    <SearchHolder marginTop={marginTop} marginBottom={marginBottom}>
      <Row>
        <View style={{ flex: 1 }}>
          <SearchInput {...customInputProps} iconProps={iconProps} />
        </View>

        {showCancelButton && (
          <SideButton onPress={handleCancel}>
            <SideButtonTitle>{t('button.cancel')}</SideButtonTitle>
          </SideButton>
        )}

        {!showCancelButton && showPasteButton && (
          <SideButton onPress={handlePaste}>
            <SideButtonTitle>{t('button.paste')}</SideButtonTitle>
          </SideButton>
        )}
      </Row>

      {!!errorMessage && <Error>{errorMessage}</Error>}
    </SearchHolder>
  );
};

export default SearchBar;

const SearchHolder = styled.View`
  margin-bottom: ${(props) => props.marginBottom || 20}px;
  margin-top: ${(props) => props.marginTop || 0}px;
  display: flex;
  align-items: center;
`;

const Row = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const SideButton = styled.TouchableOpacity`
  align-items: flex-end;
  padding: ${spacing.small}px ${spacing.large}px;
  margin-right: -${spacing.large}px;
`;
const SideButtonTitle = styled(BaseText).attrs({
  numberOfLines: 1,
  adjustsFontSizeToFit: true,
})`
  color: ${({ theme }) => theme.colors.basic000};
`;

const Error = styled(BaseText)`
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  margin-top: ${spacing.medium}px;
`;
