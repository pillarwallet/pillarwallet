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
import CenterView from '../../../storybook/CenterView';

import Selector from './Selector';

const aliceImage = 'https://picsum.photos/201';
const bobImage = 'https://picsum.photos/202';
const horizontalOpt = 'https://picsum.photos/203';
const smartWalletIcon = require('assets/icons/icon_smart_wallet.png');


const options = [
  {
    name: 'alice',
    value: 'alice',
    imageUrl: aliceImage,
    lastUpdateTime: '',
  },
  {
    name: 'bob',
    value: 'bob',
    imageUrl: bobImage,
    lastUpdateTime: '',
  },
];

storiesOf('Selector', module)
  .add('default', () => (
    <CenterView>
      <Selector
        options={options}
        onOptionSelect={() => {}}
      />
    </CenterView>
  ))
  .add('with custom wording', () => (
    <CenterView>
      <Selector
        placeholder="Choose contact"
        searchPlaceholder="Username or wallet address"
        options={options}
        onOptionSelect={() => {}}
      />
    </CenterView>
  ))
  .add('selected option', () => (
    <CenterView>
      <Selector
        placeholder="Choose contact"
        options={options}
        onOptionSelect={() => {}}
        selectedOption={options[0]}
      />
    </CenterView>
  ))
  .add('with horizontal options', () => (
    <CenterView>
      <Selector
        horizontalOptionsData={[
          {
            title: '',
            data: [
              {
                value: 'Source Item',
                name: 'Source Item',
                imageSource: smartWalletIcon,
              },
              {
                value: 'Url item',
                name: 'Url item',
                imageUrl: horizontalOpt,
              },
            ],
          },
        ]}
        options={options}
        onOptionSelect={() => {}}
      />
    </CenterView>
  ))
  .add('no options', () => (
    <CenterView>
      <Selector
        options={[]}
        onOptionSelect={() => {}}
      />
    </CenterView>
  ));
