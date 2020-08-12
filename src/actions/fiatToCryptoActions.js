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
} from 'constants/fiatToCryptoConstants';
import { reportOrWarn } from 'utils/common';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';

export const loadAltalixInfoAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      fiatToCrypto: { isAltalixAvailable },
      user: { data: { walletId } },
    } = getState();

    if (isAltalixAvailable === null) {
      const isAvailable = await api.fetchAltalixAvailability(walletId)
        .catch(error => {
          reportOrWarn('loadAltalixInfoAction: Error while requesting Altalix availability', error, 'error');
          return false;
        });
      dispatch({
        type: SET_ALTALIX_INFO,
        payload: { isAvailable },
      });
    }
  };
};

export const loadSendwyreRatesAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const { user: { data: { walletId } } } = getState();
    const rates = await api.getSendwyreRates(walletId);

    dispatch({
      type: SET_SENDWYRE_RATES,
      payload: rates,
    });
  };
};

export const loadSendwyreCountrySupportAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch({ type: LOAD_SENDWYRE_COUNTRY_SUPPORT });

    const { user: { data: { walletId } } } = getState();
    const isCountrySupported = await api.getSendwyreCountrySupport(walletId);

    if (isCountrySupported === null) {
      dispatch({ type: RESET_SENDWYRE_COUNTRY_SUPPORT });
    } else {
      dispatch({
        type: SET_SENDWYRE_COUNTRY_SUPPORT,
        payload: isCountrySupported,
      });
    }
  };
};
