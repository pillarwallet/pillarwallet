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
import { Provider } from 'react-redux';

// constants
import { ADDRESS_ZERO, ETH, GBP, PLR } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// components
import ValueInputComponent from 'components/legacy/ValueInput';

// test utils
import { createTestStore, initialTestState } from 'testUtils/store';

// local
import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../../storybook/CenterViewStretchDecorator';


// cannot import from test utils, bundler fails
export const mockPlrAddress = '0xe3818504c1b32bf1557b16c238b2e01fd3149c17';
export const mockEthAddress = ADDRESS_ZERO;

const activeAccount = {
  id: '0x',
  isActive: true,
  type: ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
};

const ethAsset = {
  symbol: ETH,
  name: 'Ethereum',
  address: mockEthAddress,
  iconUrl: '',
  decimals: 18,
};

const plrAsset = {
  symbol: PLR,
  name: 'Pillar',
  address: mockPlrAddress,
  iconUrl: '',
  decimals: 18,
};

const store = createTestStore({
  ...initialTestState,
  accounts: { data: [activeAccount] },
  assetsBalances: {
    data: {
      [activeAccount.id]: {
        ethereum: {
          wallet: {
            [mockEthAddress]: {
              symbol: ETH,
              address: mockEthAddress,
              balance: '0.512345',
            },
            [mockPlrAddress]: {
              symbol: PLR,
              address: mockPlrAddress,
              balance: '54321',
            },
          },
        },
      },
    },
  },
  rates: {
    data: {
      ethereum: {
        [mockEthAddress]: { [GBP]: 185 },
        [mockPlrAddress]: { [GBP]: 0.1 },
      },
    },
  },
  appSettings: { data: { baseFiatCurrency: GBP } },
  collectibles: { data: { ethereum: [] } },
  assets: { supportedAssets: { ethereum: [ethAsset, plrAsset] } },
});

storiesOf('Value Input', module)
  .addDecorator(CenterViewStretchDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <Provider store={store}>
      <ValueInputComponent
        value=""
        onValueChange={() => {}}
        onAssetDataChange={() => {}}
        assetData={{ ...ethAsset, contractAddress: ethAsset.address }}
      />
    </Provider>
  ));
