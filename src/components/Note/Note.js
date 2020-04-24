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
import styled from 'styled-components/native';
import Emoji from 'react-native-emoji';
import { BaseText } from 'components/Typography';
import { fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Props = {
  note: string | React.Node,
  emoji?: string,
  containerStyle?: Object,
  childrenOnRight?: React.Node,
}

const NoteWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  background-color: ${themedColors.card};
  border: 1px solid ${themedColors.border};
  padding: ${spacing.layoutSides}px;
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

export const Note = (props: Props) => {
  const {
    note,
    emoji,
    containerStyle,
    childrenOnRight,
  } = props;
  return (
    <NoteWrapper style={containerStyle}>
      <TextWrapper>
        <Text style={{ lineHeight: 19 }}>
          <NoteText>
            {note}
          </NoteText>
          {!!emoji &&
          <React.Fragment>
            {'  '}
            <NoteEmoji name={emoji} />
          </React.Fragment>
          }
        </Text>
      </TextWrapper>
      {childrenOnRight}
    </NoteWrapper>
  );
};
