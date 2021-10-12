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
import Text from 'components/core/Text';
import FiatValueView from 'components/display/FiatValueView';
import TokenValueView from 'components/display/TokenValueView';
import TokenIcon from 'components/display/TokenIcon';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { getAssetRateInFiat } from 'utils/rates';

// Types
import type { Chain } from 'models/Chain';

type Props = {|
  title: ?string,
  subtitle?: ?string,
  iconUrl: ?string,
  value: BigNumber,
  assetSymbol: string,
  assetAddress: string,
  chain: Chain,
  onPress?: () => mixed,
|};

function RewardListItem({ title, subtitle, iconUrl, value, assetSymbol, assetAddress, onPress, chain }: Props) {
  const colors = useThemeColors();

  const chainRates = useChainRates(chain);
  const currency = useFiatCurrency();

  const fiatValue = value.times(getAssetRateInFiat(chainRates, assetAddress, currency));

  return (
    <TouchableContainer onPress={onPress} disabled={!onPress}>
      <TokenIcon url={iconUrl} setMarginRight />

      <TitleContainer>
        <Text variant="medium" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && <Text color={colors.secondaryText}>{subtitle}</Text>}
      </TitleContainer>

      <RightAddOn>
        <FiatValueView value={fiatValue} currency={currency} variant="medium" />
        <TokenValueView value={value} symbol={assetSymbol} color={colors.secondaryText} />
      </RightAddOn>
    </TouchableContainer>
  );
}

export default RewardListItem;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.small}px ${spacing.large}px;
  min-height: 76px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const RightAddOn = styled.View`
  justify-content: center;
  align-items: flex-end;
  margin-left: ${spacing.medium}px;
`;
