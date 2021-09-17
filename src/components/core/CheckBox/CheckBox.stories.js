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
import { storiesOf } from '@storybook/react-native';

import CheckBox from './CheckBox';
import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../../storybook/CenterViewStretchDecorator';

const stories = storiesOf('Modern Checkbox', module)
  .addDecorator(CenterViewStretchDecorator)
  .addDecorator(WithThemeDecorator);

const CheckBoxWithState = ({ value, disabled }: { value: boolean, disabled?: boolean }) => {
  const [checked, setChecked] = React.useState(value);
  return <CheckBox value={checked} onValueChange={setChecked} disabled={disabled} style={{ margin: 20 }} />;
};

stories.add('basic', () => {
  return [
    <CheckBoxWithState key="1" value={false} />,
    <CheckBoxWithState key="2" value />,
    <CheckBoxWithState key="3" value={false} disabled />,
    <CheckBoxWithState key="4" value disabled />,
  ];
});
