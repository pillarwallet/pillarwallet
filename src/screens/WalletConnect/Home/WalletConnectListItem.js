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
import Image from 'components/Image';
import Text from 'components/modern/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

type Props = {|
  title: ?string,
  iconUrl: ?string,
  onPress?: () => mixed,
  width: number,
|};

function WalletConnectListItem({ title, iconUrl, onPress, width }: Props) {
  const colors = useThemeColors();

  return (
    <TouchableContainer onPress={onPress} disabled={!onPress} $width={width}>
      <IconContainer>
        <IconImage source={{ uri: iconUrl }} />
      </IconContainer>

      <Title numberOfLines={2} color={colors.secondaryText}>
        {title}
      </Title>
    </TouchableContainer>
  );
}

export default WalletConnectListItem;

const TouchableContainer = styled.TouchableOpacity`
  padding: ${spacing.small}px ${spacing.small}px;
  width: ${({ $width }) => $width}px;
`;

const IconContainer = styled.View`
  justify-content: center;
  align-items: center;
  margin-bottom: ${spacing.small}px;
`;

const IconImage = styled(Image)`
  width: 48px;
  height: 48px;
`;

const Title = styled(Text)`
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryText};
`;
