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
import { BigNumber } from 'bignumber.js';

// Components
import Text from 'components/modern/Text';
import TokenIcon from 'components/modern/TokenIcon';

// Selectors
import { useChainRates, useFiatCurrency } from 'selectors';

// Utils
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { getAssetValueInFiat } from 'utils/rates';
import { fontStyles, appFont, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

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
  font-family: ${appFont.medium};
`;

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
type BalanceProps = {|
  assetSymbol: string,
  assetAddress: string,
  balance: ?BigNumber,
  chain: Chain,
  onPress: ?(() => mixed),
  style?: ViewStyleProp,
|};

export function Balance({ assetSymbol, assetAddress, balance, chain, onPress, style }: BalanceProps) {
  const rates = useChainRates(chain);
  const currency = useFiatCurrency();

  if (!balance) return null;

  const balanceInFiat = getAssetValueInFiat(balance, assetAddress, rates, currency);

  return (
    <BalanceWrapper onPress={onPress} disabled={!onPress} style={style}>
      {!!balanceInFiat && <BalanceFiatValue>{formatFiatValue(balanceInFiat, currency)}</BalanceFiatValue>}

      <BalanceToken>{formatTokenValue(balance, assetSymbol)}</BalanceToken>
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
