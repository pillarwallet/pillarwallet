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
import Icon from 'components/core/Icon';
import MultilineTextInput from 'components/inputs/MultilineTextInput';
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { fontStyles, objectFontStyles } from 'utils/variables';

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
    ...objectFontStyles.large,
    textAlign: 'center',
    paddingTop: 18,
    paddingBottom: 32,
    paddingHorizontal: 42,
  },
};

const Container = styled.View``;

const PlacerholderContainer = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 6px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  z-index: -100;
  opacity: 0.4;
`;

const PlaceholderText = styled(Text)`
  ${fontStyles.large};
`;
