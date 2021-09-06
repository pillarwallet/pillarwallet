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
import { formatFiatChangeExtended } from 'utils/format';
import { useThemeColors } from 'utils/themes';

// Types
import type { TextStyleProp } from 'utils/types/react-native';

type Props = {|
  value: ?BigNumber,
  change: ?BigNumber,
  currency: string,
  variant?: TextVariant,
  color?: string,
  style?: TextStyleProp,
|};

function FiatChangeView({ value, change, currency, variant = 'regular', color, style }: Props) {
  const colors = useThemeColors();

  if (!change) return null;

  const initialBalance = value?.minus(change);
  const changeColor = color ?? (change.gte(0) ? colors?.positive : colors?.text);

  return (
    <Text variant={variant} color={changeColor} style={[styles.textStyle, style]}>
      {formatFiatChangeExtended(change, initialBalance, currency)}
    </Text>
  );
}

export default FiatChangeView;

const styles = {
  textStyle: {
    fontVariant: ['tabular-nums'],
  },
};
