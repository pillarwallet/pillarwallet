// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { useTranslation } from 'translations/translate';

// components
import Text from 'components/modern/Text';
import Spinner from 'components/Spinner';
import { Spacing } from 'components/Layout';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Utils
import { getBalanceInFiat } from 'utils/assets';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Mode = 'actual' | 'estimate';

type Props = {
  value: ?BigNumber,
  symbol: string,
  chain: Chain,
  mode?: Mode,
  isLoading?: boolean,
  isNotEnough?: boolean,
  style?: ViewStyleProp,
};

function FeeLabel({
  value,
  symbol,
  mode,
  isLoading,
  isNotEnough,
  style,
  chain,
}: Props) {
  const { t } = useTranslation();

  const [showFiatValue, setShowFiatValue] = React.useState(true);

  const chainRates = useChainRates(chain);
  const currency = useFiatCurrency();

  const colors = useThemeColors();

  if (isLoading) {
    return <Spinner size={20} trackWidth={2} style={style} />;
  }

  const valueInFiat = BigNumber(getBalanceInFiat(currency, value, chainRates, symbol));
  const labelValue = showFiatValue ? formatFiatValue(valueInFiat, currency) : formatTokenValue(value, symbol);

  return (
    <LabelWrapper style={style}>
      <Text color={colors.basic030}>{mode === 'actual' ? t('label.fee') : t('label.estimatedFee')}</Text>

      <Spacing w={8} />

      <FeePill onPress={() => setShowFiatValue(!showFiatValue)} $isNotEnough={isNotEnough}>
        <Text variant="small" color="#ffffff">
          {labelValue}
        </Text>
      </FeePill>
    </LabelWrapper>
  );
}

export default FeeLabel;

const LabelWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const FeePill = styled.TouchableOpacity`
  justify-content: center;
  padding: 0 ${spacing.small}px;
  border-radius: 12px;
  background-color: ${({ theme, $isNotEnough }) => ($isNotEnough ? theme.colors.negative : theme.colors.labelTertiary)};
`;
