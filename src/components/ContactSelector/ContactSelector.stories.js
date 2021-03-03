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

import * as React from 'react';
import { storiesOf } from '@storybook/react-native';

import ContactSelector from './ContactSelector';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewDecorator from '../../../storybook/CenterViewDecorator';

const contacts = [
  {
    name: 'Alice',
    ethAddress: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
  },
  {
    name: 'bob.pillar.eth (Invalid ENS)',
    ethAddress: 'bob.pillar.eth',
  },
  {
    name: 'Vitalik',
    ethAddress: 'vitalik.eth',
  },
];

const stories = storiesOf('ContactSelector', module).addDecorator(CenterViewDecorator).addDecorator(WithThemeDecorator);

const SelectorWrapper = ({ contact }: { contact?: any}) => {
  const [selectedContact, setSelectedContact] = React.useState(contact);
  return <ContactSelector contacts={contacts} selectedContact={selectedContact} onSelectContact={setSelectedContact} />;
};

stories.add('default', () => <SelectorWrapper />);

stories.add('selected contact', () => <SelectorWrapper contact={contacts[0]} />);

stories.add('disabled', () => <ContactSelector selectedContact={contacts[0]} disabled />);
