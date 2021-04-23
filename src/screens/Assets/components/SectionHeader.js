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
import styled from 'styled-components/native';

// Components
import Text from 'components/modern/Text';

// Utils
import { appFont, fontSizes, spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { Chain } from 'models/Asset';

type Props = {|
  title: string,
  chain: Chain,
|};

function SectionHeader({ title, chain }: Props) {
  const config = useChainsConfig();
  const chainConfig = config[chain];

  return (
    <Container>
      <SectionTitle>{title}</SectionTitle>
      <SectionChain color={chainConfig.color}>{chainConfig.title}</SectionChain>
    </Container>
  );
}

export default SectionHeader;

const Container = styled.View`
  flex-direction: row;
  align-items: baseline;
  padding: ${spacing.medium}px ${spacing.large}px ${spacing.medium}px;
  background-color: ${({ theme }) => theme.colors.background};
`;

const SectionTitle = styled(Text)`
  font-family: '${appFont.medium}';
  font-size: ${fontSizes.big}px;
`;

const SectionChain = styled(Text)`
  margin-left: ${spacing.medium}px;
  font-size: ${fontSizes.small}px;
`;
