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

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { getFormattedBalanceInFiat } from 'utils/assets';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Value } from 'utils/common';

// Local
import TokenIcon from './TokenIcon';

type Props = {|
  name: ?string,
  iconUrl: ?string,
  symbol?: string,
  balance?: ?Value,
  onPress?: () => mixed,
  onPressValue?: () => mixed,
  leftAddOn?: React.Node,
  style?: ViewStyleProp,
|};

function AssetListItem({
  name,
  symbol,
  iconUrl,
  balance,
  onPress,
  onPressValue,
  leftAddOn,
  style,
}: Props) {
  const fiatCurrency = useRootSelector((root) => root.appSettings.data.baseFiatCurrency);
  const rates = useRootSelector((root) => root.rates.data);

  const formattedFiatValue = getFormattedBalanceInFiat(fiatCurrency, balance, rates, symbol);

  const hasBalance = !!balance || balance === 0;

  return (
    <Container onPress={onPress} style={style}>
      {!!leftAddOn && <LeftAddOn>{leftAddOn}</LeftAddOn>}

      <Icon url={iconUrl} />

      <Name>{name}</Name>

      {hasBalance && (
        <ValueWrapper onPress={onPressValue}>
          {!!formattedFiatValue && <FiatValue>{formattedFiatValue}</FiatValue>}
          {balance != null && <TokenBalance>{balance} {symbol}</TokenBalance>}
        </ValueWrapper>
      )}
    </Container>
  );
}

export default AssetListItem;

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.medium}px ${spacing.large}px;
  min-height: 76px;
`;

const LeftAddOn = styled.View`
  align-self: stretch;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.large}px;
`;

const Icon = styled(TokenIcon)`
  margin-right: ${spacing.medium}px;
`;

const Name = styled(Text)`
  flex: 1;
  font-family: '${appFont.medium}';
  ${fontStyles.medium};
`;

const ValueWrapper = styled(TouchableOpacity)`
  align-self: stretch;
  justify-content: center;
  align-items: flex-end;
`;

const FiatValue = styled(Text)`
  ${fontStyles.medium};
`;

const TokenBalance = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;
