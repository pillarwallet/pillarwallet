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
import { Provider } from 'react-redux';
import { storiesOf } from '@storybook/react-native';
import { ADDRESS_ZERO } from 'constants/assetsConstants';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Test utils
import { createTestStore, initialTestState } from 'testUtils/store';

// Local
import FeeLabelToggle from './FeeLabelToggle';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewDecorator from '../../../storybook/CenterViewDecorator';


// cannot import from test utils, bundler fails
export const mockPlrAddress = '0xe3818504c1b32bf1557b16c238b2e01fd3149c17';
export const mockEthAddress = ADDRESS_ZERO;

const store = createTestStore({
  ...initialTestState,
  rates: {
    data: {
      ethereum: {
        [mockEthAddress]: {
          ETH: 1,
          EUR: 2017.2,
          GBP: 1756.24,
          USD: 2407.1,
        },
      },
    },
  },
});

storiesOf('FeeLabelToggle', module)
  .addDecorator(CenterViewDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <Provider store={store}>
      <FeeLabelToggle
        txFeeInWei="10000000000000000000"
        gasToken={{
          address: mockEthAddress,
          decimals: 18,
          symbol: 'ETH',
        }}
        chain={CHAIN.ETHEREUM}
      />
    </Provider>
  ))
  .add('not enough token', () => (
    <Provider store={store}>
      <FeeLabelToggle
        txFeeInWei="10000000000000000000"
        gasToken={{
          address: mockEthAddress,
          decimals: 18,
          symbol: 'ETH',
        }}
        chain={CHAIN.ETHEREUM}
        hasError
      />
    </Provider>
  ));
