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
import { Text as RNText } from 'react-native';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';

// Components
import { Spacing } from 'components/modern/Layout';
import Text from 'components/modern/Text';

// Utils
import { formatTokenValue } from 'utils/format';
import {
  formatFiat,
} from 'utils/common';
import { appFont, spacing } from 'utils/variables';

// Selectors
import { useFiatCurrency } from 'selectors';

// Types
import type { TextStyleProp } from 'utils/types/react-native';


type Props = {|
  value: ?BigNumber,
  symbol: string,
  style?: TextStyleProp,
|};

/**
 * Large (& stylized) component to display token value.
 */
function LargeTokenValueView({ value, symbol, style }: Props) {
  const fiatCurrency = useFiatCurrency();
  if (!value) return null;

  return (
    <Container style={style}>
      {/* TokenValue & TokenSymbol are wrapped in plain RN Text in order to make baseline work */}
      <RNText>
        <TokenSymbol>{formatFiat(value, fiatCurrency, { skipCents: true })}</TokenSymbol>
        <Spacing w={spacing.small} />
        <TokenValue>{formatTokenValue(value, symbol, { stripTrailingZeros: true })}</TokenValue>
      </RNText>
    </Container>
  );
}

export default LargeTokenValueView;

const Container = styled.View`
  flex-direction: row;
  align-items: baseline;
`;

const TokenValue = styled(Text)`
  font-size: 36px;
  font-variant: tabular-nums;
  font-family: ${appFont.medium};
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const TokenSymbol = styled(Text)`
  font-family: ${appFont.medium};
  font-size: 36px;
`;
