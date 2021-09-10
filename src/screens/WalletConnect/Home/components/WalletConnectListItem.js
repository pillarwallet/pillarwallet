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
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

type Props = {|
  title: ?string,
  iconUrl: ?string,
  onPress?: () => mixed,
  width: number,
  disabled?: boolean,
|};

function WalletConnectListItem({ title, iconUrl, onPress, width, disabled }: Props) {
  const colors = useThemeColors();

  return (
    <TouchableContainer onPress={onPress} disabled={disabled} $width={width}>
      <Icon source={{ uri: iconUrl }} />

      <Title numberOfLines={2} color={colors.secondaryText}>
        {title}
      </Title>
    </TouchableContainer>
  );
}

export default WalletConnectListItem;

const TouchableContainer = styled.TouchableOpacity`
  width: ${({ $width }) => $width}px;
  align-items: center;
  padding: ${spacing.small}px ${spacing.small}px;
  ${({ disabled }) => disabled && 'opacity: 0.3;'}
`;

const Icon = styled(Image)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

const Title = styled(Text)`
  margin-top: ${spacing.small}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryText};
`;
