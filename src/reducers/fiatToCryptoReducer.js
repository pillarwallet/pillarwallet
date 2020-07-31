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

import { SET_ALTALIX_INFO, SET_SENDWYRE_RATES } from 'constants/fiatToCryptoConstants';

import type { SendwyreRates } from 'models/FiatToCryptoProviders';

type AltalixInfo = {
  isAvailable: boolean,
};

export type FiatToCryptoReducerState = {
  altalix: null | AltalixInfo,
  sendwyre: null | {
    exchangeRates: SendwyreRates,
  },
};

type AltalixInfoSetAction = {
  type: typeof SET_ALTALIX_INFO,
  payload: AltalixInfo,
};

type LoadSendwyreRatesAction = {
  type: typeof SET_SENDWYRE_RATES,
  payload: SendwyreRates,
};

export type FiatToCryptoReducerAction = AltalixInfoSetAction | LoadSendwyreRatesAction;

const initialState = {
  altalix: null,
  sendwyre: null,
};

export default function fiatToCryptoReducer(
  state: FiatToCryptoReducerState = initialState,
  action: FiatToCryptoReducerAction,
): FiatToCryptoReducerState {
  switch (action.type) {
    case SET_ALTALIX_INFO:
      return { ...state, altalix: action.payload };
    case SET_SENDWYRE_RATES:
      return {
        ...state,
        sendwyre: { exchangeRates: action.payload },
      };
    default:
      return state;
  }
}
