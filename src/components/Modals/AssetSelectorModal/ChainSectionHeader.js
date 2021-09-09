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
import Icon from 'components/core/Icon';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';

// Types
import { type Chain } from 'models/Chain';

type Props = {|
  chain: Chain,
  onPress: () => mixed,
  isCollapsed: ?boolean,
|};

function ChainSectionHeader({ chain, onPress, isCollapsed }: Props) {
  const { title } = useChainConfig(chain);

  return (
    <Container onPress={onPress}>
      <Title numberOfLines={1}>{title}</Title>

      <Icon name={isCollapsed ? 'chevron-up' : 'chevron-down'} style={styles.collapseIcon} />
    </Container>
  );
}

export default ChainSectionHeader;

const styles = {
  collapseIcon: {
    marginRight: spacing.large,
  },
};

const Container = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Title = styled(Text)`
  flex: 1;
  ${fontStyles.big};
  font-family: ${appFont.medium};
  margin: ${spacing.mediumLarge}px ${spacing.large}px ${spacing.small}px;
`;
