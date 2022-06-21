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
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';

// Selectors
import { useActiveAccount } from 'selectors';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';
import { isKeyBasedAccount } from 'utils/accounts';
import { isLightTheme } from 'utils/themes';

// Types
import { type Chain } from 'models/Chain';

type Props = {|
  chain: Chain,
  onPress?: () => mixed,
  balance?: ?BigNumber,
  isExpanded: ?boolean,
|};

function ChainListHeader({ chain, onPress, isExpanded }: Props) {
  const { title } = useChainConfig(chain);

  const activeAccount = useActiveAccount();
  const { isDeployedOnChain, showDeploymentInterjection } = useDeploymentStatus();
  const isDeployed = isKeyBasedAccount(activeAccount) || isDeployedOnChain[chain];

  return (
    <Container>
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <Title>{title}</Title>
      </TouchableOpacity>
      {!isDeployed && (
        <TouchableOpacity onPress={() => showDeploymentInterjection(chain)}>
          <WalletNotDeployed name={isLightTheme() ? 'deploy-light' : 'deploy'} />
        </TouchableOpacity>
      )}
      {isDeployed && (
        <TouchableOpacity onPress={onPress}>
          <WalletNotDeployed name={isExpanded ? 'chevron-down' : 'chevron-right'} />
        </TouchableOpacity>
      )}
    </Container>
  );
}

export default ChainListHeader;

const Container = styled.View`
  background-color: ${({ theme }) => theme.colors.background};
  flex-direction: row;
  justify-content: space-between;
`;

const Title = styled(Text)`
  align-items: flex-start;
  margin: ${spacing.mediumLarge}px ${spacing.large}px;
  ${fontStyles.big};
  justify-content: center;
`;

const WalletNotDeployed = styled(Icon)`
  align-items: flex-end;
  margin: ${spacing.mediumLarge}px ${spacing.large}px;
  ${fontStyles.medium};
  justify-content: center;
`;
