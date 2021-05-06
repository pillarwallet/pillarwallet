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
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';

// Components
import Text from 'components/modern/Text';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { formatFiatValue } from 'utils/format';
import { spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import { type Chain } from 'models/Chain';

type Props = {|
  chain: Chain,
  onPress?: () => mixed,
  balance?: ?BigNumber,
|};

function ChainListHeader({ chain, onPress, balance }: Props) {
  const currency = useFiatCurrency();

  const { title, color } = useChainsConfig()[chain];

  const fiatValue = formatFiatValue(balance, currency, { stripTrailingZeros: true });

  return (
    <TouchableContainer onPress={onPress}>
      <Text variant="medium" color={color}>
        {title}{fiatValue != null && ` · ${fiatValue}`}
      </Text>
    </TouchableContainer>
  );
}

export default ChainListHeader;

const TouchableContainer = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${spacing.small}px ${spacing.large}px;
  align-items: center;
`;
