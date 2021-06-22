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
  UPDATE_CHAIN_RATES,
  SET_FETCHING_RATES,
} from 'constants/ratesConstants';
import { CHAIN } from 'constants/chainConstants';

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
import { supportedAssetsPerChainSelector } from 'selectors';
import { accountAssetsPerChainSelector } from 'selectors/assets';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Chain } from 'models/Chain';
import type { RatesBySymbol } from 'models/Rates';

// actions
import { saveDbAction } from './dbActions';


export const setIsFetchingRatesAction = (isFetching: boolean) => ({
  type: SET_FETCHING_RATES,
  payload: isFetching,
});

export const updateRatesAction = (
  chain: string,
  rates: RatesBySymbol,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (isEmpty(rates)) return;

    dispatch({ type: UPDATE_CHAIN_RATES, payload: { chain, rates } });

    const updatedRatesPerChain = getState().rates.data;
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

    const assetsBalancesPerAccount = assetsBalancesPerAccountSelector(getState());
    const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());

    // combine assets balances from all accounts
    const assetsBySymbolPerChain = Object.keys(CHAIN).reduce((
      combinedAssetsBySymbolPerChain,
      chainKey,
    ) => {
      const chain = CHAIN[chainKey];

      const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];

      const chainAccountsAssetsBySymbol = Object.keys(assetsBalancesPerAccount).reduce((
        combinedAssetsBySymbol,
        accountId,
      ) => {
        const accountAssetsBalances = assetsBalancesPerAccount[accountId] ?? {};
        const accountWalletAssetsBalances = accountAssetsBalances[chain]?.wallet ?? {};

        const assetsBySymbol = mapWalletAssetsBalancesIntoAssetsBySymbol(
          accountWalletAssetsBalances,
          chainSupportedAssets,
        );

        // $FlowFixMe
        return { ...combinedAssetsBySymbol, ...assetsBySymbol };
      }, {});

      // $FlowFixMe
      return { ...combinedAssetsBySymbolPerChain, [chain]: chainAccountsAssetsBySymbol };
    }, {});

    await Promise.all(Object.keys(assetsBySymbolPerChain).map(async (chain) => {
      const chainAssetsBySymbol = assetsBySymbolPerChain[chain] ?? {};

      try {
        const rates = await getExchangeRates(chain, chainAssetsBySymbol);
        await dispatch(updateRatesAction(chain, rates));
      } catch (error) {
        reportErrorLog('fetchAssetsRatesAction failed', { error, chain, chainAssetsBySymbol });
      }
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
      dispatch(setIsFetchingRatesAction(false));
      reportErrorLog('fetchSingleChainAssetRatesAction failed: cannot find asset', { assetCode });
      return;
    }

    const rates = await getExchangeRates(chain, { [asset.symbol]: asset });

    if (isEmpty(rates)) {
      dispatch(setIsFetchingRatesAction(false));
      return;
    }

    await dispatch(updateRatesAction(chain, rates));

    dispatch(setIsFetchingRatesAction(false));
  };
};
