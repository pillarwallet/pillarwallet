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

import FeeLabelToggle from './FeeLabelToggle';

storiesOf('FeeLabelToggle', module)
  .add('default', () => (
    <CenterView>
      <FeeLabelToggle
        txFeeInWei="10000000000000000000"
        gasToken={{
          address: '0x0',
          decimals: 18,
          symbol: 'ETH',
        }}
      />
    </CenterView>
  ))
  .add('not enough token', () => (
    <CenterView>
      <FeeLabelToggle
        txFeeInWei="10000000000000000000"
        gasToken={{
          address: '0x0',
          decimals: 18,
          symbol: 'ETH',
        }}
        notEnoughToken
      />
    </CenterView>
  ));
