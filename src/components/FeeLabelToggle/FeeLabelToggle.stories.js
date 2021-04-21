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
import { defaultFiatCurrency } from 'constants/assetsConstants';

import { FeeLabelToggleComponent } from './FeeLabelToggle';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewDecorator from '../../../storybook/CenterViewDecorator';

const reduxData = {
  accountAssets: {},
  accountHistory: [],
  baseFiatCurrency: defaultFiatCurrency,
  isGasTokenSupported: true,
  rates: {
    ETH: {
      ETH: 1,
      EUR: 2017.2,
      GBP: 1756.24,
      USD: 2407.1,
    },
  },
};

storiesOf('FeeLabelToggle', module)
  .addDecorator(CenterViewDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <FeeLabelToggleComponent
      {...reduxData}
      txFeeInWei="10000000000000000000"
      gasToken={{
        address: '0x0',
        decimals: 18,
        symbol: 'ETH',
      }}
    />
  ))
  .add('not enough token', () => (
    <FeeLabelToggleComponent
      {...reduxData}
      txFeeInWei="10000000000000000000"
      gasToken={{
        address: '0x0',
        decimals: 18,
        symbol: 'ETH',
      }}
      hasError
    />
  ));
