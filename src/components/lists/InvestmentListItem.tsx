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
import { useTranslation } from 'react-i18next';
import { formatFullAmount } from 'utils/common';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';
import { getCurrencySymbol } from 'utils/common';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selector
import { useFiatCurrency } from 'selectors';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Props = {
  network: Chain;
  name: string;
  position: number;
  logoURI: string;
  balance?: BigNumber;
  onPress?: () => void;
  style?: ViewStyleProp;
};

/**
 * Standard investment list item displaying network, name, balance, logoURI, and position.
 */
export default function ({ network, name, balance, onPress, style, logoURI, position }: Props) {
  const { t } = useTranslation();

  const config = useChainConfig(network || CHAIN.ETHEREUM);
  const currency = useFiatCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const networkName = network ? config.title : undefined;

  const aa = formatFullAmount(balance);

  const decimalValue: any = `10e${17}`;

  const amount: any = parseInt(aa) / (decimalValue ?? 1);

  return (
    <Container
      onPress={onPress}
      disabled={!onPress}
      style={style}
      hitSlop={{ top: spacing.medium, bottom: spacing.medium }}
    >
      <TokenIcon url={logoURI} chain={network} setMarginRight />

      <TitleContainer>
        <Title numberOfLines={1}>{name}</Title>
        {!!network && <Subtitle numberOfLines={1}>{t('label.on_network', { network: networkName })}</Subtitle>}
      </TitleContainer>

      <BalanceWrapper>
        <BalanceFiatValue numberOfLines={1}>{currencySymbol + amount.toFixed(2) ?? ''}</BalanceFiatValue>
        <PositionValue numberOfLines={1}>{t('label.on_position', { position })}</PositionValue>
      </BalanceWrapper>
    </Container>
  );
}

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  min-height: 76px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const BalanceWrapper = styled.View`
  margin-left: ${spacing.medium}px;
  justify-content: flex-end;
  align-items: flex-end;
`;

const BalanceFiatValue = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;

const PositionValue = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  font-variant: tabular-nums;
`;
