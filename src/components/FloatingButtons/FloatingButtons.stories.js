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
import { View, FlatList } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import FloatingButtons from './FloatingButtons';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';

const stories = storiesOf('FloatingButtons', module).addDecorator(WithThemeDecorator);

stories.add('1 item', () => (
  <FloatingButtons items={[{ title: 'Add contact', iconName: 'add-contact' }]} />
));

stories.add('2 items', () => (
  <FloatingButtons
    items={[
      { title: 'Add contact', iconName: 'add-contact' },
      { title: 'Invite friend', iconName: 'plus' },
    ]}
  />
));

stories.add('3 items', () => (
  <FloatingButtons
    items={[
      { title: 'Add contact', iconName: 'add-contact' },
      { title: 'Invite friend', iconName: 'plus' },
      { title: 'Send', iconName: 'send' },
    ]}
  />
));

stories.add('With flat list', () => (
  <View>
    <FlatList
      data={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
      renderItem={({ item }) => <View style={{ height: 100, backgroundColor: item % 2 ? 'red' : 'blue' }} />}
      contentContainerStyle={{ paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
    />

    <FloatingButtons
      items={[
        { title: 'Add contact', iconName: 'add-contact' },
        { title: 'Invite friend', iconName: 'plus' },
        { title: 'Send', iconName: 'send' },
      ]}
    />
  </View>
));
