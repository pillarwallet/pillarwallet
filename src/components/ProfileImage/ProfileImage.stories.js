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

import ProfileImage from './ProfileImage';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewDecorator from '../../../storybook/CenterViewDecorator';

const usdcIcon = require('assets/images/usdc_color.png');

storiesOf('ProfileImage', module)
  .addDecorator(CenterViewDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <ProfileImage userName="Username" />
  ))
  .add('with border', () => (
    <ProfileImage userName="Username" borderWidth={2} />
  ))
  .add('with addon image', () => (
    <ProfileImage
      userName="Username"
      cornerIcon={usdcIcon}
      cornerIconSize={16}
    />
  ))
  .add('identicon', () => (
    <ProfileImage userName="Username" />
  ))
  .add('identicon with custom diameter', () => (
    <ProfileImage userName="Username" diameter={64} />
  ));
