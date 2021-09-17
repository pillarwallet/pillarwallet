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

// Components
import Text, { type TextVariant } from 'components/core/Text';

// Utils
import { formatTokenValue, formatTokenChange } from 'utils/format';
import { useThemeColors } from 'utils/themes';

// Types
import type { TextStyleProp } from 'utils/types/react-native';

type Mode = 'balance' | 'change';

type Props = {|
  value: ?BigNumber,
  symbol: string,
  variant?: TextVariant,
  mode?: Mode,
  color?: string,
  style?: TextStyleProp,
|};

function TokenValueView({
  value,
  symbol,
  variant,
  mode = 'balance',
  color,
  style,
}: Props) {
  const colors = useThemeColors();

  if (!value) return null;

  if (mode === 'change') {
    const changeColor = color ?? (value.gte(0) ? colors?.positive : colors?.text);

    return (
      <Text variant={variant} color={changeColor} style={[styles.textStyle, style]}>
        {formatTokenChange(value, symbol, { stripTrailingZeros: true })}
      </Text>
    );
  }

  return (
    <Text variant={variant} color={color} style={[styles.textStyle, style]}>
      {formatTokenValue(value, symbol, { stripTrailingZeros: true })}
    </Text>
  );
}

export default TokenValueView;

const styles = {
  textStyle: {
    fontVariant: ['tabular-nums'],
  },
};
