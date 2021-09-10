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
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';

// Components
import Text from 'components/core/Text';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { formatFiatValue } from 'utils/format';

// Types
import type { TextStyleProp } from 'utils/types/react-native';

type Props = {
  balance: BigNumber | number,
  style?: TextStyleProp,
};

function BalanceView({ balance, style }: Props) {
  const currency = useFiatCurrency();

  return <Balance style={style}>{formatFiatValue(balance, currency)}</Balance>;
}

export default BalanceView;

const Balance = styled(Text)`
  text-align: center;
  font-size: 30px;
  font-variant: tabular-nums;
`;
