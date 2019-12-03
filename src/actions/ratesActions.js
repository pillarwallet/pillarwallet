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

import isEmpty from 'lodash.isempty';

// constants
import { UPDATE_RATES } from 'constants/ratesConstants';

// services
import { getExchangeRates } from 'services/assets';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// models, types
import type { Rates } from 'models/Asset';
import type { Dispatch, GetState } from 'reducers/rootReducer';

// actions
import { saveDbAction } from './dbActions';


export const setRatesAction = (rates: Rates) => {
  return async (dispatch: Dispatch) => {
    if (isEmpty(rates)) return;
    dispatch(saveDbAction('rates', { rates }, true));
    dispatch({ type: UPDATE_RATES, payload: rates });
  };
};

export const fetchAccountAssetsRatesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accountAssets = accountAssetsSelector(getState());
    const rates = await getExchangeRates(Object.keys(accountAssets));
    dispatch(setRatesAction(rates));
  };
};

export const fetchSingleAssetRatesAction = (assetCode: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const rates = await getExchangeRates([assetCode]);
    if (isEmpty(rates)) return;
    const { rates: { data: currentRates } } = getState();
    const updatedRates = { ...currentRates, ...rates };
    dispatch(setRatesAction(updatedRates));
  };
};
