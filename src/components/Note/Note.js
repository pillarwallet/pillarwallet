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
import { Text } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import Emoji from 'react-native-emoji';
import { BaseText } from 'components/legacy/Typography';
import IconButton from 'components/IconButton';
import { fontStyles, spacing, fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';


type Props = {
  note: string | React.Node,
  emoji?: string,
  containerStyle?: Object,
  children?: React.Node,
  onClose?: () => void,
  theme: Theme,
};

const NoteWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.basic050};
  border: 1px solid ${({ theme }) => theme.colors.basic060};
  padding: ${spacing.layoutSides}px;
  padding-top: ${({ additionalPaddingTop }) => additionalPaddingTop ? '24' : spacing.layoutSides}px;
  border-radius: 4px;
`;

const TextWrapper = styled.View`
  flex-direction: row;
  flex: 1;
`;

const NoteText = styled(BaseText)`
  ${fontStyles.medium};
`;

const NoteEmoji = styled(Emoji)`
  font-size: 16px;
  color: #000000;
`;

const CloseIcon = styled(IconButton)`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px;
`;

export const Note = withTheme((props: Props) => {
  const {
    note,
    emoji,
    containerStyle,
    children,
    onClose,
    theme,
  } = props;
  const colors = getThemeColors(theme);

  return (
    <NoteWrapper additionalPaddingTop={!!onClose} style={containerStyle}>
      <TextWrapper>
        <Text style={{ lineHeight: 19 }}>
          <NoteText>
            {note}
          </NoteText>
          {!!emoji && '  '}
          {!!emoji && <NoteEmoji name={emoji} />}
        </Text>
      </TextWrapper>
      {children}
      {onClose && <CloseIcon icon="close" color={colors.basic020} fontSize={fontSizes.tiny} onPress={onClose} />}
    </NoteWrapper>
  );
});
