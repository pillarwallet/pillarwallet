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

import { images } from 'utils/images';
import { LIGHT_THEME } from 'constants/appSettingsConstants';
import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../../storybook/CenterViewStretchDecorator';
import SettingsItemCarded from './SettingsItemCarded';


const { smartWalletIcon } = images({ current: LIGHT_THEME, colors: {} });

storiesOf('SettingsItemCarded', module)
  .addDecorator(CenterViewStretchDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <SettingsItemCarded
      title="This is card's title"
      iconSource={smartWalletIcon}
    />
  ))
  .add('with subtitle', () => (
    <SettingsItemCarded
      title="This is card's title"
      subtitle="And this - subtitle"
      iconSource={smartWalletIcon}
    />
  ))
  .add('active card', () => (
    <SettingsItemCarded
      title="This is card's title"
      subtitle="And this - subtitle"
      iconSource={smartWalletIcon}
      isActive
    />
  ))
  .add('loading card', () => (
    <SettingsItemCarded
      title="This is card's title"
      subtitle="And this - subtitle"
      iconSource={smartWalletIcon}
      isLoading
    />
  ))
  .add('edge cases', () => (
    <SettingsItemCarded
      title="This is longer card's title. To test layout on edge cases"
      subtitle="And longer subtitle for the same reason"
      iconSource={smartWalletIcon}
      isLoading
    />
  ));
