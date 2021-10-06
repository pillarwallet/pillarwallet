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
import Text from 'components/core/Text';
import Spinner from 'components/Spinner';
import { Spacing } from 'components/legacy/Layout';

// Utils
import { formatTokenValue } from 'utils/format';
import { useThemeColors } from 'utils/themes';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Mode = 'actual' | 'estimate';

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
type Props = {
  value: ?BigNumber,
  assetSymbol: string,
  assetAddress: string,
  chain: Chain,
  mode?: Mode,
  isLoading?: boolean,
  isNotEnough?: boolean,
  style?: ViewStyleProp,
};

function FeeLabel({
  value,
  assetSymbol,
  mode,
  isLoading,
  isNotEnough,
  style,
}: Props) {
  const { t } = useTranslation();

  const colors = useThemeColors();

  if (isLoading) {
    return <Spinner size={20} trackWidth={2} style={style} />;
  }

  const tokenValue = formatTokenValue(value, assetSymbol);

  return (
    <LabelWrapper style={style}>
      <Text color={isNotEnough ? colors.negative : colors.basic030}>
        {mode === 'actual' ? t('label.fee') : t('label.estimatedFee')}
      </Text>

      <Spacing w={8} />

      <FeeValue $isNotEnough={isNotEnough}>
        <Text color={isNotEnough ? colors.negative : colors.secondaryText}>{tokenValue}</Text>
      </FeeValue>

    </LabelWrapper>
  );
}

export default FeeLabel;

const LabelWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const FeeValue = styled.View`
  justify-content: center;
`;
