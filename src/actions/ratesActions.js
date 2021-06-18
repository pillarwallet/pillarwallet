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
import {
  SET_CHAIN_RATES,
  SET_FETCHING_RATES,
} from 'constants/ratesConstants';

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
import {
  assetsBalancesSelector,
  ratesPerChainSelector,
  supportedAssetsPerChainSelector,
} from 'selectors';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Chain } from 'models/Chain';
import type { RatesByAssetSymbol } from 'models/RatesByAssetSymbol';

// actions
import { saveDbAction } from './dbActions';


export const setIsFetchingRatesAction = (isFetching: boolean) => ({
  type: SET_FETCHING_RATES,
  payload: isFetching,
});

export const setRatesAction = (
  chain: Chain,
  rates: RatesByAssetSymbol,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (isEmpty(rates)) return;

    const ratesPerChain = ratesPerChainSelector(getState());
    const currentChainRates = ratesPerChain[chain] ?? {};

    const updatedRates = { ...currentChainRates, ...rates };

    dispatch({ type: SET_CHAIN_RATES, payload: { chain, rates: updatedRates } });

    const updatedRatesPerChain = ratesPerChainSelector(getState());
    await dispatch(saveDbAction('rates', { rates: updatedRatesPerChain }, true));
  };
};

export const fetchAssetsRatesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      rates: { isFetching },
      session: { data: { isOnline } },
    } = getState();

    if (isFetching || !isOnline) return;

    dispatch(setIsFetchingRatesAction(true));

    const assetsBalances = assetsBalancesSelector(getState());
    const supportedAssets = supportedAssetsPerChainSelector(getState());

    await Promise.all(Object.keys(assetsBalances).map(async (accountId) => {
      const accountAssetsBalances = assetsBalances[accountId] ?? {};

      await Promise.all(Object.keys(accountAssetsBalances).map(async (chain) => {
        const chainSupportedAssets = supportedAssets[chain] ?? [];
        const walletAssets = accountAssetsBalances[chain]?.wallet ?? {};

        const accountAssets = mapWalletAssetsBalancesIntoAssetsBySymbol(walletAssets, chainSupportedAssets);
        const rates = await getExchangeRates(chain, accountAssets);

        await dispatch(setRatesAction(chain, rates));
      }));
    }));

    dispatch(setIsFetchingRatesAction(false));
  };
};

export const fetchSingleChainAssetRatesAction = (
  chain: Chain,
  assetCode: string,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      rates: { isFetching },
      session: { data: { isOnline } },
    } = getState();

    if (isFetching || !isOnline) return;

    dispatch(setIsFetchingRatesAction(true));

    const accountAssetsPerChain = accountAssetsPerChainSelector(getState());
    const chainAccountAssets = accountAssetsPerChain[chain] ?? {};

    const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());
    const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];

    const asset = getAssetData(getAssetsAsList(chainAccountAssets), chainSupportedAssets, assetCode);
    if (!asset) {
      reportErrorLog('fetchSingleChainAssetRatesAction failed: cannot find asset', { assetCode });
      return;
    }

    const rates = await getExchangeRates(chain, { [asset.symbol]: asset });

    if (isEmpty(rates)) return;

    await dispatch(setRatesAction(chain, rates));

    dispatch(setIsFetchingRatesAction(false));
  };
};
