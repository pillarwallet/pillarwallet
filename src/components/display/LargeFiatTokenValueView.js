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
import { Spacing } from 'components/layout/Layout';
import TokenValueView from 'components/display/TokenValueView';
import FiatValueView from 'components/display/FiatValueView';

// Utils
import { appFont, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { getAssetValueInFiat } from 'utils/rates';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Types
import type { TextStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Props = {|
  value: ?BigNumber,
  assetAddress: ?string,
  chain: Chain,
  symbol: string,
  style?: TextStyleProp,
|};

/**
 * Large (& stylized) component to display token value.
 */
function LargeFiatTokenValueView({ value, assetAddress, chain, symbol, style }: Props) {
  const fiatCurrency = useFiatCurrency();
  const colors = useThemeColors();
  const rates = useChainRates(chain);
  if (!value || !assetAddress) return null;
  const balanceInFiat = getAssetValueInFiat(value, assetAddress, rates, fiatCurrency);

  return (
    <Container style={style}>
      {/* TokenValue & TokenSymbol are wrapped in plain RN Text in order to make baseline work */}
      <RNText style={styles.fiatTokenText} numberOfLines={1} adjustsFontSizeToFit>
        <FiatValueView value={balanceInFiat} currency={fiatCurrency} style={styles.fiatTokenValue} />
        <Spacing w={spacing.small} />
        <TokenValueView
          value={value}
          symbol={symbol}
          color={colors.secondaryText}
          style={styles.fiatTokenValue}
        />
      </RNText>
    </Container>
  );
}

export default LargeFiatTokenValueView;

const styles = {
  fiatTokenText: {
    fontSize: 30,
    lineHeight: 30,
  },
  fiatTokenValue: {
    fontFamily: appFont.medium,
    fontSize: 30,
    lineHeight: 30,
  },
};

const Container = styled.View`
  flex-direction: row;
  align-items: baseline;
`;
