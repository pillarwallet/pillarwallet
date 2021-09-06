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
import { Keyboard, LayoutAnimation, View, TextInput as RNTextInput } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import Clipboard from '@react-native-community/clipboard';
import t from 'translations/translate';

// Components
import { BaseText } from 'components/legacy/Typography';

// Utils
import { SIDE_BUTTON_APPEARANCE } from 'utils/layoutAnimations';
import { getColorByThemeOutsideStyled, useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

// Local
import SearchInput from './SearchInput';
import type { InputPropsType, IconProps } from './SearchInput';


type Props = {|
  query: ?string,
  onChangeQuery: (string) => mixed,
  validator?: (string) => ?string,
  placeholder?: string,
  inputRef?: React.ElementRef<typeof RNTextInput>,
  showPasteButton?: boolean,
  onFocus?: () => void,
  onBlur?: () => void,
  cancelButtonTitle?: string,
  inputProps?: InputPropsType,
  iconProps?: IconProps,
  style?: ViewStyleProp,
|};

/**
 * @deprecated This compontent is considered legacy and should not be used in new code
 *
 * Use: components/SearchBar instead
 */
const SearchBar = ({
  query,
  onChangeQuery,
  validator,
  inputProps,
  placeholder = t('label.search'),
  inputRef,
  showPasteButton,
  iconProps,
  style,
  onFocus,
  onBlur,
  cancelButtonTitle,
}: Props) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const theme = useTheme();
  const colors = useThemeColors();

  const validateInput = (input: string) => {
    if (!validator) return;

    const error = validator(input);
    setErrorMessage(error);
  };

  const handleChangeText = (input: string) => {
    onChangeQuery(input);
    validateInput(input);
  };

  const handleFocus = () => {
    onFocus?.();
    LayoutAnimation.configureNext(SIDE_BUTTON_APPEARANCE);
    setIsFocused(true);
  };

  const handleBlur = () => {
    LayoutAnimation.configureNext(SIDE_BUTTON_APPEARANCE);
    setIsFocused(false);
    onBlur?.();
  };

  const handleCancel = () => {
    onChangeQuery('');
    Keyboard.dismiss();
  };

  const handlePaste = async () => {
    const value = await Clipboard.getString();
    onChangeQuery(value);
    validateInput(value);
  };

  const handleSubmit = () => {
    onChangeQuery(query ?? '');
  };

  const defaultBackgroundColor = getColorByThemeOutsideStyled(theme.current, {
    lightKey: 'basic060',
    darkKey: 'basic080',
  });

  const getBorderColor = (): string => {
    if (errorMessage) return colors.secondaryAccent240;
    if (isFocused) return colors.basic000;
    return defaultBackgroundColor;
  };

  const customInputProps = {
    value: query,
    onChangeText: handleChangeText,
    inputProps,
    isFocused,
    colors,
    backgroundColor: defaultBackgroundColor,
    placeholder,
    inputRef,
    onFocus: handleFocus,
    onBlur: handleBlur,
    handleSubmit,
    borderColor: getBorderColor(),
  };

  const showCancelButton = isFocused || !!query;

  return (
    <SearchHolder style={style}>
      <Row>
        <View style={{ flex: 1 }}>
          <SearchInput {...customInputProps} iconProps={iconProps} />
        </View>

        {showCancelButton && (
          <SideButton onPress={handleCancel}>
            <SideButtonTitle>{cancelButtonTitle || t('button.cancel')}</SideButtonTitle>
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

export type { IconProps } from './SearchInput';

const SearchHolder = styled.View`
  display: flex;
  align-items: center;
  padding: ${spacing.small}px ${spacing.layoutSides}px;
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
