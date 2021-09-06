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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import Text from 'components/core/Text';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';

// Types
import { type Chain } from 'models/Chain';

type Props = {|
  chain: Chain,
  onPress?: () => mixed,
|};

function ChainSectionHeader({ chain, onPress }: Props) {
  const { t } = useTranslation();
  const { title } = useChainConfig(chain);

  const { isDeployedOnChain, showDeploymentInterjection } = useDeploymentStatus();

  const isDeployed = isDeployedOnChain[chain];

  return (
    <Container>
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <Title>{title}</Title>
      </TouchableOpacity>

      {!isDeployed && (
        <TouchableOpacity onPress={() => showDeploymentInterjection(chain)}>
          <WalletNotDeployed>{t('label.walletNotDeployed')}</WalletNotDeployed>
        </TouchableOpacity>
      )}
    </Container>
  );
}

export default ChainSectionHeader;

const Container = styled.View`
  background-color: ${({ theme }) => theme.colors.background};
  align-items: stretch;
`;

const Title = styled(Text)`
  ${fontStyles.big};
  font-family: ${appFont.medium};
  margin: ${spacing.mediumLarge}px ${spacing.large}px;
`;

const WalletNotDeployed = styled(Text)`
  padding-bottom: ${spacing.mediumLarge}px;
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.link};
`;
