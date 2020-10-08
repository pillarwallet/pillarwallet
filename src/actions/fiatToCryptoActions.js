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

// constants
import {
  SET_ALTALIX_AVAILABILITY,
  SET_SENDWYRE_RATES,
  LOAD_SENDWYRE_COUNTRY_SUPPORT,
  SET_SENDWYRE_COUNTRY_SUPPORT,
  RESET_SENDWYRE_COUNTRY_SUPPORT,
} from 'constants/fiatToCryptoConstants';

// utils
import { reportLog, reportOrWarn } from 'utils/common';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';


export const loadAltalixAvailability = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      fiatToCrypto: { isAltalixAvailable },
      user: { data: user },
    } = getState();

    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('loadAltalixAvailability failed: no walletId', { user });
      return;
    }

    if (isAltalixAvailable === null) {
      const isAvailable = await api.fetchAltalixAvailability(walletId)
        .catch(error => {
          reportOrWarn('loadAltalixInfoAction: Error while requesting Altalix availability', error, 'error');
          return false;
        });
      dispatch({
        type: SET_ALTALIX_AVAILABILITY,
        payload: isAvailable,
      });
    }
  };
};

export const loadSendwyreRatesAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const user = getState().user.data;
    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('loadSendwyreRatesAction failed: no walletId', { user });
      return;
    }

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

    const user = getState().user.data;
    const walletId = user?.walletId;
    if (!walletId) {
      reportLog('loadSendwyreCountrySupportAction failed: no walletId', { user });
      return;
    }

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
