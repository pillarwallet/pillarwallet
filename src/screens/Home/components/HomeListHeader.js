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
import { Image } from 'react-native';
import styled from 'styled-components/native';

// Components
import Text from 'components/modern/Text';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { ImageSource } from 'utils/types/react-native';

export type Props = {|
  title: string,
  iconSource?: ImageSource,
  color?: string,
|};

function HomeListHeader({ title, iconSource, color }: Props) {
  return (
    <Container>
      <Icon source={iconSource} />
      <Title $color={color} numberOfLines={1}>
        {title}
      </Title>
    </Container>
  );
}

export default HomeListHeader;

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${spacing.mediumLarge}px;
  padding: ${spacing.mediumLarge}px 0;
`;

const Icon = styled(Image)`
  margin-right: ${spacing.medium}px;
`;

const Title = styled(Text)`
  flex: 1;
  font-family: '${appFont.medium}';
  ${fontStyles.big};
  ${({ $color }) => `color: ${$color}`};
`;
