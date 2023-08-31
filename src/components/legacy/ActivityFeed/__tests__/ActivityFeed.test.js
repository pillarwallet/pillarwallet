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
import renderer from 'react-test-renderer';
import { render } from '@testing-library/react-native';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { ThemeProvider } from 'styled-components/native';
import { defaultTheme } from 'utils/themes';
import ActivityFeed from 'components/legacy/ActivityFeed/ActivityFeed';
import { I18nextProvider } from 'react-i18next';
import i18n from 'services/localisation/testing';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

import { initialState as historyState } from 'reducers/historyReducer';
import { initialState as assetsState } from 'reducers/assetsReducer';
import { initialState as accountsState } from 'reducers/accountsReducer';
import { initialState as ensRegistryState } from 'reducers/ensRegistryReducer';
import { initialState as smartWalletState } from 'reducers/smartWalletReducer';
import { initialState as sessionState } from 'reducers/sessionReducer';
import { initialState as appSettingsState } from 'reducers/appSettingsReducer';
import { initialState as assetsBalancesState } from 'reducers/assetsBalancesReducer';

const mockStore = configureMockStore([thunk]);

const initialStore = mockStore({
  assets: assetsState,
  accounts: accountsState,
  history: historyState,
  ensRegistry: ensRegistryState,
  smartWallet: smartWalletState,
  session: sessionState,
  appSettings: appSettingsState,
  assetsBalances: assetsBalancesState,
});

const Component = (store, children) =>
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Provider>,
  );

const transaction = (attrs = {}) => {
  return {
    type: TRANSACTION_EVENT,
    createdAt: +new Date('2019-09-09 12:00') / 1000,
    value: '0',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x0000000000000000000000000000000000000000',
    ...attrs,
  };
};

describe('ActivityFeed', () => {
  it('renders the Asset correctly', () => {
    const transactions = [transaction()];

    const tabs = [{ data: transactions }];

    const component = Component(
      initialStore,
      <ThemeProvider theme={defaultTheme}>
        <ActivityFeed tabs={tabs} />
      </ThemeProvider>,
    ).toJSON();

    expect(component).toMatchSnapshot();
  });

  it('does not fail for invalid values', () => {
    const transactions = [transaction({ value: undefined })];

    const tabs = [{ data: transactions }];

    const component = Component(
      initialStore,
      <ThemeProvider theme={defaultTheme}>
        <ActivityFeed tabs={tabs} />
      </ThemeProvider>,
    ).toJSON();

    expect(component).toMatchSnapshot();
  });
});
