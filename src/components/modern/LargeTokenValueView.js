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
import { formatTokenValueWithoutSymbol } from 'utils/format';
import { appFont, spacing } from 'utils/variables';

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
  if (!value) return null;

  return (
    <Container style={style}>
      {/* TokenValue & TokenSymbol are wrapped in plain RN Text in order to make baseline work */}
      <RNText>
        <TokenValue>{formatTokenValueWithoutSymbol(value, symbol, { stripTrailingZeros: true })}</TokenValue>
        <Spacing w={spacing.extraSmall} />
        <TokenSymbol>{symbol}</TokenSymbol>
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
`;

const TokenSymbol = styled(Text)`
  font-family: ${appFont.medium};
  font-size: 20px;
  color: ${({ theme }) => theme.colors.secondaryText};
`;
