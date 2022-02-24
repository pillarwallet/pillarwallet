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
/* eslint-disable i18next/no-literal-string */

import * as React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/native';

// Components
import Icon from 'components/legacy/Icon';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {
  value: boolean;
  onValueChange?: (value: boolean) => any;
  disabled?: boolean;
  style?: ViewStyleProp;
};

const Checkbox = ({ value, onValueChange, disabled, style }: Props) => {
  const handlePress = () => {
    if (disabled) return;

    onValueChange?.(!value);
  };

  return (
    <View style={style}>
      <TouchableWithoutFeedback onPress={handlePress} disabled={disabled || !onValueChange}>
        <Field disabled={disabled} testID="checkBox">
          {!!value && <CheckMark />}
        </Field>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Checkbox;

const Field = styled.View`
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  margin: 2px;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.colors.checkBoxField};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`;

const CheckMark = styled(Icon).attrs({ name: 'check' })`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.checkMark};
`;
