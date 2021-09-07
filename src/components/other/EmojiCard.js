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

// Components
import Text from 'components/core/Text';

// Utils
import { fontStyles, spacing } from 'utils/variables';

type Props = {|
  title: ?string,
  emoji: string,
|};

function EmojiCard({ title, emoji }: Props) {
  return (
    <Container>
      <Title>{title}</Title>
      <EmojiCircle>
        <Emoji>{emoji}</Emoji>
      </EmojiCircle>
    </Container>
  );
}

export default EmojiCard;

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  min-height: 96px;
  margin-vertical: ${spacing.mediumLarge}px;
  padding: ${spacing.medium}px ${spacing.large}px ${spacing.medium}px ${spacing.mediumLarge}px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 10px;
`;

const Title = styled(Text)`
  flex: 1;
  ${fontStyles.medium};
`;

const EmojiCircle = styled.View`
  aspect-ratio: 1;
  justify-content: center;
  align-items: center;
  margin-left: ${spacing.mediumLarge}px;
  background-color: ${({ theme }) => theme.colors.basic060};
  padding-horizontal: ${spacing.medium}px;
  border-radius: 1000px;
`;

const Emoji = styled(Text)`
  font-size: 20px;
  margin-top: 2px;
  margin-left: 1px;
`;
