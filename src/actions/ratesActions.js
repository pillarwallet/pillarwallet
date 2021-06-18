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
import { isEmpty } from 'lodash';

// constants
import { UPDATE_RATES } from 'constants/ratesConstants';

// services
import { getExchangeRates } from 'services/assets';

// utils
import {
  getAssetData,
  getAssetsAsList,
  mapWalletAssetsBalancesIntoAssetsBySymbol,
} from 'utils/assets';
import { reportErrorLog } from 'utils/common';

// selectors
import { accountAssetsPerChainSelector } from 'selectors/assets';
import { assetsBalancesSelector, supportedAssetsPerChainSelector } from 'selectors';

// models, types
import type { Rates } from 'models/Asset';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Chain } from 'models/Chain';

// actions
import { saveDbAction } from './dbActions';


export const setRatesAction = (newRates: Rates) => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (isEmpty(newRates)) return;
    const { rates: { data: currentRates = {} } } = getState();
    // $FlowFixMe: flow update to 0.122
    const rates = { ...currentRates, ...newRates };
    dispatch(saveDbAction('rates', { rates }, true));
    dispatch({ type: UPDATE_RATES, payload: rates });
  };
};

export const fetchAssetsRatesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const assetsBalances = assetsBalancesSelector(getState());
    const supportedAssets = supportedAssetsPerChainSelector(getState());

    const allAccountsCrossChainAssets = Object.keys(assetsBalances).reduce((combinedAssets, accountId) => {
      const accountAssetsBalances = assetsBalances[accountId] ?? {};

      const accountAssets = Object.keys(accountAssetsBalances).reduce((assets, chain) => {
        const chainSupportedAssets = supportedAssets[chain] ?? [];
        const walletAssets = accountAssetsBalances[chain]?.wallet ?? {};
        const mapped = mapWalletAssetsBalancesIntoAssetsBySymbol(walletAssets, chainSupportedAssets);
        // $FlowFixMe
        return { ...assets, ...mapped };
      }, {});

      return { ...combinedAssets, ...accountAssets };
    }, {});

    if (isEmpty(allAccountsCrossChainAssets)) {
      reportErrorLog('fetchAssetsRatesAction failed: allAccountsCrossChainAssets is empty');
      return;
    }

    const rates = await getExchangeRates(allAccountsCrossChainAssets);
    dispatch(setRatesAction(rates));
  };
};

export const fetchSingleChainAssetRatesAction = (
  chain: Chain,
  assetCode: string,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accountAssets = accountAssetsPerChainSelector(getState());
    const chainAccountAssets = accountAssets[chain] ?? {};

    const supportedAssets = supportedAssetsPerChainSelector(getState());
    const chainSupportedAssets = supportedAssets[chain] ?? [];

    const asset = getAssetData(getAssetsAsList(chainAccountAssets), chainSupportedAssets, assetCode);
    if (!asset) {
      reportErrorLog('fetchSingleChainAssetRatesAction failed: cannot find asset', { assetCode });
      return;
    }

    const rates = await getExchangeRates({ [asset.symbol]: asset });

    if (isEmpty(rates)) return;

    const { rates: { data: currentRates } } = getState();
    const updatedRates = { ...currentRates, ...rates };
    dispatch(setRatesAction(updatedRates));
  };
};
