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
import { useTranslation } from 'translations/translate';

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Selectors
import { useActiveAccount, useRootSelector } from 'selectors';
import { isDeployedOnChainSelector } from 'selectors/chains';

// Utils
import { useThemeColors } from 'utils/themes';
import { useChainConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';
import {
  isArchanovaAccount,
  isKeyBasedAccount,
} from 'utils/accounts';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Props = {|
  chain: Chain,
  style?: ViewStyleProp,
|};

/**
 * Display warning if given transaction will cause wallet deployment.
 */
function TransactionDeploymentWarning({ chain, style }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const chainConfig = useChainConfig(chain);
  const activeAccount = useActiveAccount();

  const isDeployed = useRootSelector(isDeployedOnChainSelector)[chain];

  /**
   *  - No warning for key based since no deployments
   *  - No warning for Archanova as it won't deploy on transaction
   */
  if (isDeployed
    || isKeyBasedAccount(activeAccount)
    || isArchanovaAccount(activeAccount)) {
    return null;
  }

  return (
    <Container style={style}>
      <Icon name="warning" color={colors.negative} />
      <Title>
        {t('label.transactionDeploymentWarning', { chain: chainConfig.titleShort })}
      </Title>
    </Container>
  );
}

export default TransactionDeploymentWarning;

const Container = styled.View`
  flex-direction: row;
`;

const Title = styled(Text)`
  flex: 1;
  margin-left: ${spacing.mediumLarge}px;
  color: ${({ theme }) => theme.colors.tertiaryText};
`;
