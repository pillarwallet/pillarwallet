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

import React from 'react';
import { storiesOf } from '@storybook/react-native';

import ToastCard from './ToastCard';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../storybook/CenterViewStretchDecorator';


const normalText = 'Magna culpa aliquip nisi in eu';

const longText = 'Magna culpa aliquip nisi in eu Lorem reprehenderit laborum ' +
  'duis. In exercitation exercitation ex irure. Lorem non nostrud laboris ' +
  'consectetur culpa aliquip sunt pariatur velit cillum magna dolor.';

storiesOf('ToastCard', module)
  .addDecorator(CenterViewStretchDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <ToastCard
      message={normalText}
      emoji="hash"
    />
  ))
  .add('long text', () => (
    <ToastCard
      message={longText}
      emoji="hash"
    />
  ))
  .add('link', () => (
    <ToastCard
      message={normalText}
      emoji="hash"
      link="toast link"
    />
  ));
