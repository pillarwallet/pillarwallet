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
import FiatChangeView from 'components/display/FiatChangeView';
import TokenIcon from 'components/display/TokenIcon';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Utils
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { getAssetRateInFiat } from 'utils/rates';

// Types
import type { Chain } from 'models/Chain';

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
type Props = {|
  title: ?string,
  iconUrl: ?string,
  value: BigNumber,
  change?: BigNumber,
  assetSymbol: string,
  assetAddress: string,
  chain: Chain,
  onPress?: () => mixed,
|};

function WalletListItem({
  title,
  iconUrl,
  value,
  change,
  assetSymbol,
  assetAddress,
  onPress,
  chain,
}: Props) {
  const colors = useThemeColors();

  const chainRates = useChainRates(chain);
  const currency = useFiatCurrency();

  const rate = getAssetRateInFiat(chainRates, assetAddress, currency);
  const fiatValue = value.times(rate);
  const tokenValue = formatTokenValue(value, assetSymbol);
  const unitPrice = formatFiatValue(rate, currency);

  return (
    <TouchableContainer onPress={onPress} disabled={!onPress}>
      <TokenIcon url={iconUrl} chain={chain} setMarginRight />

      <TitleContainer>
        <Text variant="medium" numberOfLines={1}>
          {title}
        </Text>
        <Text color={colors.secondaryText}>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          {tokenValue} · {unitPrice}
        </Text>
      </TitleContainer>

      <RightAddOn>
        <FiatValueView value={fiatValue} currency={currency} variant="medium" />
        <FiatChangeView value={fiatValue} change={change} currency={currency} />
      </RightAddOn>
    </TouchableContainer>
  );
}

export default WalletListItem;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.small}px ${spacing.large}px;
  min-height: 76px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 5px
`;

const RightAddOn = styled.View`
  justify-content: center;
  align-items: flex-end;
  margin-left: ${spacing.medium}px;
`;
