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

// Components
import Text from 'components/modern/Text';
import TokenIcon from 'components/modern/TokenIcon';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { formatTokenAmount } from 'utils/common';
import { getFormattedBalanceInFiat } from 'utils/assets';
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Value } from 'utils/common';

/**
 * This file contains low-level building blocks for constructing custom Asset List Item.
 *
 * The same components are used to build `AssetListItem` component.
 */

export const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.medium}px ${spacing.large}px;
  min-height: 76px;
`;

export const LeftAddOn = styled.View`
  align-self: stretch;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.large}px;
`;

export const Icon = styled(TokenIcon)`
  margin-right: ${spacing.medium}px;
`;

export const Name = styled(Text)`
  flex: 1;
  ${fontStyles.medium};
`;

type BalanceProps = {|
  symbol: string,
  balance: Value,
  onPress: ?(() => mixed),
  style?: ViewStyleProp,
|};

export function Balance({
  symbol,
  balance,
  onPress,
  style,
}: BalanceProps) {
  const fiatCurrency = useRootSelector((root) => root.appSettings.data.baseFiatCurrency);
  const rates = useRootSelector((root) => root.rates.data);

  const formattedBalance = formatTokenAmount(balance, symbol);
  const formattedFiatValue = getFormattedBalanceInFiat(fiatCurrency, balance, rates, symbol);

  return (
    <BalanceWrapper onPress={onPress} disabled={!onPress} style={style}>
      {!!formattedFiatValue && <BalanceFiatValue>{formattedFiatValue}</BalanceFiatValue>}
      {balance != null && (
        <BalanceToken>
          {formattedBalance} {symbol}
        </BalanceToken>
      )}
    </BalanceWrapper>
  );
}

const BalanceWrapper = styled(TouchableOpacity)`
  margin-left: ${spacing.medium}px;
  align-self: stretch;
  justify-content: center;
  align-items: flex-end;
`;

const BalanceFiatValue = styled(Text)`
  ${fontStyles.medium};
`;

const BalanceToken = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;
