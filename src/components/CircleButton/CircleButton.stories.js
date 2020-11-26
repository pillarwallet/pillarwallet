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
import { View } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import CircleButton from 'components/CircleButton';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';

const Decorator = (story) => (
  <View style={{
    padding: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  }}
  >
    {story()}
  </View>
);

storiesOf('CircleButton', module)
  .addDecorator(Decorator)
  .addDecorator(WithThemeDecorator)
  .add('all cases', () => (
    <>
      <CircleButton fontIcon="paperPlane" onPress={() => {}} label="Default" />
      <CircleButton fontIcon="paperPlane" onPress={() => {}} label="Disabled" disabled />
      <CircleButton fontIcon="paperPlane" onPress={() => {}} label="With indicator" showIndicator />
    </>
  ));
