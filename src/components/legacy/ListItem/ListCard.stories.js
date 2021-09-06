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
import Emoji from 'react-native-emoji';

import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../../storybook/CenterViewStretchDecorator';
import { ListCard } from './ListCard';

const TITLE = 'Long list title to check layout on edge cases';

storiesOf('ListCard', module)
  .addDecorator(CenterViewStretchDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <ListCard title="List title" />
  ))
  .add('with custom icon', () => (
    <ListCard
      title={TITLE}
      customIcon={<Emoji name="gear" style={{ marginRight: 10 }} />}
    />
  ))
  .add('with label', () => (
    <ListCard
      title={TITLE}
      labelBadge={{ label: 'label badge' }}
    />
  ))
  .add('with labelText', () => (
    <ListCard
      title={TITLE}
      label="label text"
    />
  ))
  .add('with note', () => (
    <ListCard
      title={TITLE}
      note={{ note: 'Note text that takes up at least two lines' }}
    />
  ))
  .add('with subtitle', () => (
    <ListCard
      title={TITLE}
      subtitle="Longer subtitle text to check how lines wrap"
      label="Label text"
    />
  ));
