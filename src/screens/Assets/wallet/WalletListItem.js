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
import FiatValueView from 'components/modern/FiatValueView';
import FiatChangeView from 'components/modern/FiatChangeView';
import TokenIcon from 'components/modern/TokenIcon';

// Selectors
import { useRates, useFiatCurrency } from 'selectors';

// Utils
import { getRate } from 'utils/assets';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

type Props = {|
  title: ?string,
  iconUrl: ?string,
  value: BigNumber,
  change?: BigNumber,
  symbol: string,
  onPress?: () => mixed,
|};

function WalletListItem({ title, iconUrl, value, change, symbol, onPress }: Props) {
  const colors = useThemeColors();

  const rates = useRates();
  const currency = useFiatCurrency();

  const rate = getRate(rates, symbol, currency);
  const fiatValue = value.times(rate);
  const tokenValue = formatTokenValue(value, symbol);
  const unitPrice = formatFiatValue(rate, currency);

  return (
    <TouchableContainer onPress={onPress} disabled={!onPress}>
      <TokenIcon url={iconUrl} style={styles.icon} />

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

const styles = {
  icon: {
    marginRight: spacing.medium,
  },
};

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
