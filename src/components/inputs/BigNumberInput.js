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
import { TextInput as RNTextInput } from 'react-native';
import { BigNumber } from 'bignumber.js';

// Components
import AutoScaleTextInput, { type Props as AutoScaleTextInputProps } from 'components/inputs/AutoScaleTextInput';

// Utils
import { useThemeColors } from 'utils/themes';

// eslint-disable-next-line flowtype/generic-spacing
type PassthroughProps = $Diff<
  AutoScaleTextInputProps,
  {
    value: $PropertyType<AutoScaleTextInputProps, 'value'>,
    onChange: $PropertyType<AutoScaleTextInputProps, 'onChange'>,
    onChangeText: $PropertyType<AutoScaleTextInputProps, 'onChangeText'>,
  },
>;

type Props = {|
  ...PassthroughProps,
  value: ?BigNumber,
  onValueChange?: (value: ?BigNumber) => mixed,
  decimals?: number,
  maxValue?: ?BigNumber,
  maxFontSize?: number,
|};

type Instance = typeof RNTextInput;

/**
 * Input component for BigNumbers.
 *
 * This is intended to be used as general base for concrete components.
 *
 * Visible value is driven by `value` prop of `?BigNumber` type, however it holds internal `rawValue` string state
 * which always represents the same numeric value, but allows for temporary input values like '0.' or '0.000' in order
 * to allow user to input all allowed numbers.
 */
const BigNumberInput = React.forwardRef<Props, Instance>((props, ref) => {
  const {
    value,
    onValueChange,
    decimals,
    maxFontSize,
    placeholder = '0',
    maxValue,
    style,
    ...passthroughProps
  } = props;

  const colors = useThemeColors();

  const [rawValue, setRawValue] = React.useState('');

  React.useLayoutEffect(() => {
    const currentValue = parseBigNumber(rawValue);

    // Sync `rawValue` state iff `value` is numerically different.
    if (!areEqual(currentValue, value)) {
      setRawValue(value?.toFixed(passthroughProps?.toFixed && passthroughProps.toFixed) ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, rawValue]);

  const handleChangeText = (newRawValue: string) => {
    const normalizedValue = normalizeRawValue(newRawValue, decimals);
    if (!numberInProgressRegex.test(normalizedValue)) return;

    const newValue = parseBigNumber(normalizedValue);
    if (newValue?.isNaN()) return;

    setRawValue(normalizedValue);

    // Raise event only when new value is numerically different.
    const currentValue = parseBigNumber(rawValue);
    if (!areEqual(currentValue, newValue)) {
      onValueChange?.(newValue);
    }
  };

  const color = maxValue && value?.gt(maxValue) ? colors.negative : colors.text;

  return (
    <AutoScaleTextInput
      {...passthroughProps}
      ref={ref}
      value={rawValue}
      onChangeText={handleChangeText}
      placeholder={placeholder}
      keyboardType="decimal-pad"
      style={[baseStyle, style, { color }]}
      maxFontSize={maxFontSize}
    />
  );
});

export default BigNumberInput;

const baseStyle = {
  fontSize: 52,
};

// Accepts values like '.', '0.', etc
const numberInProgressRegex = /^\d*\.?\d*$/;

/**
 * This function can be invoke after user inputing consecutive charaters OR user pasting whole string.
 */
function normalizeRawValue(input: string, decimals: ?number): string {
  let result = input.replace(/,/g, '.').replace(/\s/g, '');

  // Trip leading and trailing spaces
  result = result.trim();

  // Trim leading zeros, but allow '0' & '0.'
  if (result.startsWith('0')) {
    result = result.replace(/^0+/, '');
    if (result === '') {
      result = '0';
    }
  }

  // Ensure 0 before decimal point
  if (result.startsWith('.')) {
    result = `0${result}`;
  }

  // Truncate too much decimal points
  if (decimals != null && getDecimalPlaces(result) > decimals) {
    result = BigNumber(result).toFixed(decimals, BigNumber.ROUND_DOWN);
  }

  return result;
}

function parseBigNumber(input: string): ?BigNumber {
  if (!input) return null;
  return BigNumber(input);
}

function areEqual(first: ?BigNumber, second: ?BigNumber) {
  return (first == null && second == null) || (first != null && second != null && first.eq(second));
}

function getDecimalPlaces(input: string): number {
  const [, decimalPart] = input.split('.');
  return decimalPart?.length ?? 0;
}
