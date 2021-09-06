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
import styled from 'styled-components/native';

// Components
import BigNumberInput from 'components/inputs/BigNumberInput';
import FiatIcon from 'components/display/FiatIcon';
import Text from 'components/core/Text';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { appFont, fontSizes, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  value: ?BigNumber,
  onValueChange: (value: ?BigNumber) => mixed,
  style?: ViewStyleProp,
  editable?: boolean,
|};

type Instance = typeof RNTextInput;

/**
 * TextInput for handling fiat value input.
 */
const FiatValueInput = React.forwardRef<Props, Instance>((props, ref) => {
  const { value, onValueChange, style, editable } = props;

  const currency = useFiatCurrency();

  return (
    <Container style={style}>
      <BigNumberInput
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        decimals={2}
        editable={editable}
        style={styles.input}
      />

      <FiatInfo>
        <FiatSymbol>{currency}</FiatSymbol>
        <FiatIcon currency={currency} size={24} />
      </FiatInfo>
    </Container>
  );
});

export default FiatValueInput;

const styles = {
  input: {
    flex: 1,
  },
};

const Container = styled.View`
  flex-direction: row;
  align-items: flex-end;
`;

// Currency symbol & icons are positioned by hand, because baseline alignment does not work for android.
const FiatInfo = styled.View`
  flex-direction: row;
  align-items: center;
  margin-left: ${spacing.medium}px;
  margin-bottom: ${spacing.small}px;
`;

const FiatSymbol = styled(Text)`
  font-family: ${appFont.medium};
  font-size: ${fontSizes.big}px;
  padding-right: ${spacing.small}px;
`;
