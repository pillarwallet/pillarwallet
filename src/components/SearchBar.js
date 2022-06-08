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
import { Platform, TextInput as RNTextInput } from 'react-native';
import styled from 'styled-components/native';

// Components
import Icon from 'components/core/Icon';
import MultilineTextInput from 'components/inputs/MultilineTextInput';
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { fontStyles, fontSizes, lineHeights } from 'utils/variables';

// Types
import type { ViewStyleProp, TextStyleProp } from 'utils/types/react-native';

type Props = {
  query: string,
  onQueryChange: (query: string) => mixed,
  placeholder?: string,
  error?: boolean,
  showSearchIcon?: boolean,
  style?: ViewStyleProp,
  inputStyle?: TextStyleProp,
  inputRef?: React.Ref<typeof RNTextInput>,
  autoFocus?: boolean,
};

function SearchInput({
  query,
  onQueryChange,
  placeholder,
  error,
  showSearchIcon = true,
  style,
  inputStyle,
  inputRef,
  autoFocus = false,
}: Props) {
  const colors = useThemeColors();

  const handleChangeText = (text: string) => {
    const input = text.trimLeft().replace(/\s\s/g, ' ');
    onQueryChange(input);
  };

  const inputStyles = [styles.input, { color: error ? colors.negative : colors.text }, inputStyle];

  return (
    <Container style={style}>
      <MultilineTextInput
        ref={inputRef}
        value={query}
        onChangeText={handleChangeText}
        style={inputStyles}
        autoCapitalize="none"
        autoCompleteType="off"
        autoCorrect={false}
        blurOnSubmit
        autoFocus={autoFocus}
        contextMenuHidden
        // eslint-disable-next-line i18next/no-literal-string
        returnKeyType="done"
      />

      {!query && (
        <PlacerholderContainer>
          {showSearchIcon && <Icon name="search" color={colors.tertiaryText} />}
          <PlaceholderText color={colors.tertiaryText} style={inputStyle}>
            {placeholder}
          </PlaceholderText>
        </PlacerholderContainer>
      )}
    </Container>
  );
}

export default SearchInput;

const styles = {
  input: {
    fontSize: fontSizes.large,
    // Weird Android bug: setting line height style cause view size jump from "" -> "A" (anything not empty).
    lineHeight: Platform.OS !== 'android' ? lineHeights.large : undefined,
    textAlign: 'center',
    maxHeight: 120,
  },
};

const Container = styled.View`
  padding: 18px 32px 22px;
`;

const PlacerholderContainer = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: ${Platform.select({ ios: '8', android: '0' })}px;
  bottom: ${Platform.select({ ios: '0', android: '6' })}px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  z-index: -100;
  opacity: 0.4;
`;

const PlaceholderText = styled(Text)`
  ${fontStyles.large};
`;
