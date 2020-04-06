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
import renderer from 'react-test-renderer';
import Asset from 'screens/Asset';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { initialState as smartWalletState } from 'reducers/smartWalletReducer';
import { initialState as balancesState } from 'reducers/balancesReducer';
import { initialState as paymentNetworkState } from 'reducers/paymentNetworkReducer';
import { initialState as userState } from 'reducers/userReducer';
import { initialState as historyState } from 'reducers/historyReducer';
import { initialState as contactsState } from 'reducers/contactsReducer';
import { initialState as assetsState } from 'reducers/assetsReducer';
import { initialState as ratesState } from 'reducers/ratesReducer';
import { initialState as accountsState } from 'reducers/accountsReducer';
import { initialState as featureFlagsState } from 'reducers/featureFlagsReducer';
import { initialState as appSettingsState } from 'reducers/appSettingsReducer';
import { initialState as userSettingsState } from 'reducers/userSettingsReducer';
import { initialState as exchangeState } from 'reducers/exchangeReducer';

import { defaultTheme } from 'utils/themes';

const mockStore = configureMockStore([thunk]);

const initialStore = mockStore({
  user: userState,
  smartWallet: smartWalletState,
  balances: balancesState,
  paymentNetwork: paymentNetworkState,
  history: historyState,
  contacts: contactsState,
  assets: assetsState,
  rates: ratesState,
  accounts: accountsState,
  featureFlags: featureFlagsState,
  appSettings: appSettingsState,
  userSettings: userSettingsState,
  exchange: exchangeState,
});

const Component = (store, navigation) => (
  <ThemeProvider theme={defaultTheme}>
    <Provider store={store}>
      <Asset navigation={navigation} />
    </Provider>
  </ThemeProvider>
);

describe('Asset', () => {
  const navigation = {
    addListener: jest.fn(),
    state: {
      params: {
        assetData: {
          token: 'PLR',
          patternIcon: 'http://icons/plr?size=3',
        },
      },
    },
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('renders the Asset Screen correctly', () => {
    const component = renderer.create(Component(initialStore, navigation)).toJSON();
    expect(component).toMatchSnapshot();
  });
});
