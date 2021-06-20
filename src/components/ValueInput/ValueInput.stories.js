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
import { ETH, GBP, PLR } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// components
import ValueInputComponent from 'components/ValueInput';

// test utils
import { createTestStore, initialTestState } from 'testUtils/store';

// local
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewStretchDecorator from '../../../storybook/CenterViewStretchDecorator';


const activeAccount = {
  id: '0x',
  isActive: true,
  type: ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
};

const ethAsset = {
  symbol: ETH,
  name: 'Ethereum',
  address: '0x',
  iconUrl: '',
  decimals: 18,
};

const plrAsset = {
  symbol: PLR,
  name: 'Pillar',
  address: '0x',
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
            [ETH]: {
              balance: '0.512345',
              symbol: ETH,
            },
            [PLR]: {
              balance: '54321',
              symbol: PLR,
            },
          },
        },
      },
    },
  },
  rates: {
    data: {
      ethereum: {
        [ETH]: { [GBP]: 185 },
        [PLR]: { [GBP]: 0.1 },
      },
    },
  },
  appSettings: { data: { baseFiatCurrency: GBP } },
  collectibles: { data: [] },
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
        assetData={ethAsset}
      />
    </Provider>
  ));
