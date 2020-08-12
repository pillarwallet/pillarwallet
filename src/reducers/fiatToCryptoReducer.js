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
  LOAD_SENDWYRE_COUNTRY_SUPPORT,
  SET_SENDWYRE_COUNTRY_SUPPORT,
  RESET_SENDWYRE_COUNTRY_SUPPORT,
  SENDWYRE_SUPPORT,
} from 'constants/fiatToCryptoConstants';

import type { SendwyreRates } from 'models/FiatToCryptoProviders';

export type FiatToCryptoReducerState = {|
  isAltalixAvailable: null | boolean,
  sendwyreExchangeRates: null | SendwyreRates,
  sendwyreCountrySupport: $Values<typeof SENDWYRE_SUPPORT>,
|};

type AltalixInfoSetAction = {
  type: typeof SET_ALTALIX_INFO,
  payload: { isAvailable: boolean },
};

type SetSendwyreRatesAction = {
  type: typeof SET_SENDWYRE_RATES,
  payload: SendwyreRates,
};

type LoadSendwyreCountrySupportAction = {
  type: typeof LOAD_SENDWYRE_COUNTRY_SUPPORT,
};

type SetSendwyreCountrySupportAction = {
  type: typeof SET_SENDWYRE_COUNTRY_SUPPORT,
  payload: boolean,
}

type ResetSendwyreCountrySupportAction = {
  type: typeof RESET_SENDWYRE_COUNTRY_SUPPORT,
};

export type FiatToCryptoReducerAction =
  | AltalixInfoSetAction
  | SetSendwyreRatesAction
  | LoadSendwyreCountrySupportAction
  | SetSendwyreCountrySupportAction
  | ResetSendwyreCountrySupportAction;

const initialState = {
  isAltalixAvailable: null,
  sendwyreExchangeRates: null,
  sendwyreCountrySupport: SENDWYRE_SUPPORT.UNKNOWN,
};

export default function fiatToCryptoReducer(
  state: FiatToCryptoReducerState = initialState,
  action: FiatToCryptoReducerAction,
): FiatToCryptoReducerState {
  switch (action.type) {
    case SET_ALTALIX_INFO:
      return {
        ...state,
        isAltalixAvailable: action.payload.isAvailable,
      };
    case SET_SENDWYRE_RATES:
      return {
        ...state,
        sendwyreExchangeRates: action.payload,
      };
    case LOAD_SENDWYRE_COUNTRY_SUPPORT:
      return {
        ...state,
        sendwyreCountrySupport: SENDWYRE_SUPPORT.LOADING,
      };
    case SET_SENDWYRE_COUNTRY_SUPPORT:
      return {
        ...state,
        sendwyreCountrySupport: action.payload ? SENDWYRE_SUPPORT.SUPPORTED : SENDWYRE_SUPPORT.UNSUPPORTED,
      };
    case RESET_SENDWYRE_COUNTRY_SUPPORT:
      return {
        ...state,
        sendwyreCountrySupport: SENDWYRE_SUPPORT.UNKNOWN,
      };
    default:
      return state;
  }
}
