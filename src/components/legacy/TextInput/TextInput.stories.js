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

import React, { useState } from 'react';
import { storiesOf } from '@storybook/react-native';

import TextInput from 'components/legacy/TextInput';
import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../../storybook/CenterViewStretchDecorator';

const leftSideImage = 'https://picsum.photos/100';

const TextInputWithState = (props) => {
  const [value, setValue] = useState('');
  const [selectorValue, setSelectorValue] = useState({});
  const { inputProps = {} } = props;

  const setValueByType = (val) => {
    if (val?.selector) {
      setSelectorValue(val);
    } else {
      setValue(val);
    }
  };

  return (
    <TextInput
      {...props}
      inputProps={{
        ...inputProps,
        value,
        selectorValue,
        onChange: setValueByType,
      }}
    />
  );
};

storiesOf('TextInput', module)
  .addDecorator(CenterViewStretchDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <TextInputWithState
      inputProps={{
        placeholder: 'Placeholder',
        label: 'Label',
        rightLabel: 'Right label',
      }}
    />
  ))
  .add('multiline', () => (
    <TextInputWithState
      inputProps={{
        placeholder: 'Placeholder',
        label: 'Label',
        multiline: true,
      }}
    />
  ))
  .add('numeric', () => (
    <TextInputWithState
      inputProps={{
        placeholder: '0',
        keyboardType: 'decimal-pad',
        label: 'Label',
        rightLabel: 'Right label',
      }}
      numeric
    />
  ))
  .add('numeric with all addons', () => (
    <TextInputWithState
      inputProps={{
        placeholder: '0',
        keyboardType: 'decimal-pad',
      }}
      numeric
      innerImageURI={leftSideImage}
      leftSideText="left side"
      leftSideSymbol="plus"
      loading
      rightPlaceholder="addon"
      iconProps={{ icon: 'plus' }}
    />
  ))
  .add('with button', () => (
    <TextInputWithState
      inputProps={{
        placeholder: 'Placeholder',
      }}
      buttonProps={{
        title: 'Button',
        small: true,
        marginRight: 12,
        onPress: () => {},
      }}
    />
  ));
