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

// Components
import Text from 'components/modern/Text';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { getCurrencySymbol, formatFiatValue } from 'utils/common';
import { appFont, fontStyles } from 'utils/variables';

// Types
import type { ViewStyleProp, TextStyleProp } from 'utils/types/react-native';


type Props = {
  balance: BigNumber | number,
  style?: ViewStyleProp,
  currencyTextStyle?: TextStyleProp,
  balanceTextStyle?: TextStyleProp,
};

function BalanceView({
  balance,
  style,
  currencyTextStyle,
  balanceTextStyle,
}: Props) {
  const fiatCurrency = useFiatCurrency();

  return (
    <Container style={style}>
      <CurrencySymbol style={currencyTextStyle}>{getCurrencySymbol(fiatCurrency)}</CurrencySymbol>
      <Balance style={balanceTextStyle}>{formatFiatValue(balance)}</Balance>
    </Container>
  );
}

export default BalanceView;

const Container = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
`;

const CurrencySymbol = styled(Text)`
  font-family: '${appFont.archiaMedium}';
  ${fontStyles.big};
  margin-top: 6px;
`;

const Balance = styled(Text)`
  font-family: '${appFont.archiaMedium}';
  font-size: 30px;
  line-height: 46px;
`;
