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

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';

import {
  SET_ALTALIX_AVAILABILITY,
  SET_SENDWYRE_RATES,
  LOAD_SENDWYRE_COUNTRY_SUPPORT,
  SET_SENDWYRE_COUNTRY_SUPPORT,
  RESET_SENDWYRE_COUNTRY_SUPPORT,
  SENDWYRE_SUPPORT,
} from 'constants/fiatToCryptoConstants';
import {
  loadAltalixAvailability,
  loadSendwyreRatesAction,
  loadSendwyreCountrySupportAction,
} from 'actions/fiatToCryptoActions';

function mockStore({ state, pillarSdk }) {
  return configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue])(state);
}

describe('Fiat to crypto providers actions', () => {
  describe('Altalix', () => {
    it('loadAltalixAvailability should set availability', async () => {
      const store = mockStore({
        state: {
          user: { data: { walletId: 'wallet-id' } },
          fiatToCrypto: { isAltalixAvailable: null },
        },
        pillarSdk: {
          fetchAltalixAvailability: async id => id && true,
        },
      });

      const expectedActions = [{ type: SET_ALTALIX_AVAILABILITY, payload: true }];

      await store.dispatch(loadAltalixAvailability());
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });
  });

  describe('Sendwyre', () => {
    it('loadSendwyreRatesAction should fetch Sendwyre exchange rates', async () => {
      const rates = { USDETH: { USD: 1, ETH: 1 } };
      const walletId = 'wallet-id';

      const store = mockStore({
        state: {
          user: { data: { walletId } },
          fiatToCrypto: { sendwyreExchangeRates: null },
        },
        pillarSdk: {
          getSendwyreRates: async id => id && rates,
        },
      });

      const expectedActions = [{
        type: SET_SENDWYRE_RATES,
        payload: rates,
      }];

      await store.dispatch(loadSendwyreRatesAction());
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });

    it('loadSendwyreCountrySupportAction should set Sendwyre availability', async () => {
      const walletId = 'wallet-id';

      const store = mockStore({
        state: {
          user: { data: { walletId } },
          fiatToCrypto: { sendwyreCountrySupport: SENDWYRE_SUPPORT.UNKNOWN },
        },
        pillarSdk: {
          getSendwyreCountrySupport: async id => id && true,
        },
      });

      const expectedActions = [{
        type: LOAD_SENDWYRE_COUNTRY_SUPPORT,
      }, {
        type: SET_SENDWYRE_COUNTRY_SUPPORT,
        payload: true,
      }];

      await store.dispatch(loadSendwyreCountrySupportAction());
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });

    it('loadSendwyreCountrySupportAction should clear Sendwyre availability on error', async () => {
      const walletId = 'wallet-id';

      const store = mockStore({
        state: {
          user: { data: { walletId } },
          fiatToCrypto: { sendwyreCountrySupport: SENDWYRE_SUPPORT.UNKNOWN },
        },
        pillarSdk: {
          getSendwyreCountrySupport: async () => null,
        },
      });

      const expectedActions = [{
        type: LOAD_SENDWYRE_COUNTRY_SUPPORT,
      }, {
        type: RESET_SENDWYRE_COUNTRY_SUPPORT,
      }];

      await store.dispatch(loadSendwyreCountrySupportAction());
      const actualActions = store.getActions();
      expect(actualActions).toEqual(expectedActions);
    });
  });
});
