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

import {
  SET_ALTALIX_INFO,
  SET_SENDWYRE_RATES,
  SENDWYRE_SUPPORT,
  LOAD_SENDWYRE_COUNTRY_SUPPORT,
  SET_SENDWYRE_COUNTRY_SUPPORT,
  RESET_SENDWYRE_COUNTRY_SUPPORT,
} from 'constants/fiatToCryptoConstants';
import reducer from 'reducers/fiatToCryptoReducer';

describe('Fiat to crypto providers reducer', () => {
  it('should handle SET_ALTALIX_INFO', () => {
    const action = {
      type: SET_ALTALIX_INFO,
      payload: { isAvailable: true },
    };

    const expectedState = {
      isAltalixAvailable: true,
    };

    expect(reducer(undefined, action)).toMatchObject(expectedState);
  });

  it('should handle SET_SENDWYRE_RATES', () => {
    const rates = { USDETH: { USD: 1, ETH: 1 } };
    const action = {
      type: SET_SENDWYRE_RATES,
      payload: rates,
    };

    const expectedState = {
      sendwyreExchangeRates: rates,
    };

    expect(reducer(undefined, action)).toMatchObject(expectedState);
  });

  it('should handle LOAD_SENDWYRE_COUNTRY_SUPPORT', () => {
    const action = { type: LOAD_SENDWYRE_COUNTRY_SUPPORT };

    const expectedState = {
      sendwyreCountrySupport: SENDWYRE_SUPPORT.LOADING,
    };

    expect(reducer(undefined, action)).toMatchObject(expectedState);
  });

  it('should handle SET_SENDWYRE_COUNTRY_SUPPORT within supported countries', () => {
    const action = {
      type: SET_SENDWYRE_COUNTRY_SUPPORT,
      payload: true,
    };

    const expectedState = {
      sendwyreCountrySupport: SENDWYRE_SUPPORT.SUPPORTED,
    };

    expect(reducer(undefined, action)).toMatchObject(expectedState);
  });

  it('should handle SET_SENDWYRE_COUNTRY_SUPPORT outside of supported countries', () => {
    const action = {
      type: SET_SENDWYRE_COUNTRY_SUPPORT,
      payload: false,
    };

    const expectedState = {
      sendwyreCountrySupport: SENDWYRE_SUPPORT.UNSUPPORTED,
    };

    expect(reducer(undefined, action)).toMatchObject(expectedState);
  });

  it('should handle RESET_SENDWYRE_COUNTRY_SUPPORT', () => {
    const action = { type: RESET_SENDWYRE_COUNTRY_SUPPORT };

    const expectedState = {
      sendwyreCountrySupport: SENDWYRE_SUPPORT.UNKNOWN,
    };

    expect(reducer(undefined, action)).toMatchObject(expectedState);
  });
});

