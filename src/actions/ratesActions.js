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
import { assetsSelector } from 'selectors';

// utils
import { isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';

// models, types
import type { Assets, Rates } from 'models/Asset';
import type { Dispatch, GetState } from 'reducers/rootReducer';

// actions
import { saveDbAction } from './dbActions';


export const setRatesAction = (newRates: Rates) => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (isEmpty(newRates)) return;
    const { rates: { data: currentRates = {} } } = getState();
    const rates = { ...currentRates, ...newRates };
    dispatch(saveDbAction('rates', { rates }, true));
    dispatch({ type: UPDATE_RATES, payload: rates });
  };
};

export const fetchAccountAssetsRatesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accountAssets = accountAssetsSelector(getState());
    const rates = await getExchangeRates(accountAssets);
    dispatch(setRatesAction(rates));
  };
};

export const fetchAllAccountsAssetsRatesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const allAccountsAssets = assetsSelector(getState());

    // check if not empty just in case
    if (isEmpty(allAccountsAssets)) {
      reportErrorLog('fetchAllAccountsAssetsRatesAction failed: empty all account assets', { allAccountsAssets });
      return;
    }

    const allAssets = (Object.values(allAccountsAssets): any).reduce((allAssetsCombined, accountAssets: Assets) => {
      // check if not empty just in case
      if (accountAssets) {
        Object.keys(accountAssets).forEach((assetSymbol) => {
          if (!allAssetsCombined[assetSymbol]) allAssetsCombined[assetSymbol] = accountAssets[assetSymbol];
        });
      }
      return allAssetsCombined;
    }, {});

    const rates = await getExchangeRates(allAssets);
    dispatch(setRatesAction(rates));
  };
};

export const fetchSingleAssetRatesAction = (assetCode: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const asset = getState().assets.supportedAssets.find(({ symbol }) => isCaseInsensitiveMatch(assetCode, symbol));
    if (!asset) {
      reportErrorLog('fetchSingleAssetRatesAction failed: cannot find asset', { assetCode });
      return;
    }

    const rates = await getExchangeRates({ [asset.symbol]: asset });

    if (isEmpty(rates)) return;

    const { rates: { data: currentRates } } = getState();
    const updatedRates = { ...currentRates, ...rates };
    dispatch(setRatesAction(updatedRates));
  };
};
