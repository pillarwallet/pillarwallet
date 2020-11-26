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
import InsightWithButton from './InsightWithButton';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../storybook/CenterViewStretchDecorator';

const itemsList = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
];

storiesOf('InsightWithButton', module)
  .addDecorator(CenterViewStretchDecorator)
  .addDecorator(WithThemeDecorator)
  .add('with list', () => (
    <InsightWithButton
      title="Some short title"
      itemsList={itemsList}
      buttonTitle="Wow, press me!"
      onButtonPress={() => {}}
    />
  ))
  .add('without list', () => (
    <InsightWithButton
      buttonTitle="Wow, press me!"
      description={itemsList[0]}
      buttonProps={{ primarySecond: true }}
      onButtonPress={() => {}}
    />
  ));
