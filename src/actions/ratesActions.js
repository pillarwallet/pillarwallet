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
import { UPDATE_CHAIN_RATES, SET_FETCHING_RATES } from 'constants/ratesConstants';
import { CHAIN } from 'constants/chainConstants';

// services
import { getExchangeRates } from 'services/assets';

// utils
import { getAssetsAsList, mapWalletAssetsBalancesIntoAssetsByAddress } from 'utils/assets';
import { reportErrorLog } from 'utils/common';

// selectors
import { supportedAssetsPerChainSelector } from 'selectors';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Chain } from 'models/Chain';
import type { RatesByAssetAddress } from 'models/Rates';

// actions
import { saveDbAction } from './dbActions';

export const setIsFetchingRatesAction = (isFetching: boolean) => ({
  type: SET_FETCHING_RATES,
  payload: isFetching,
});

export const updateRatesAction = (chain: string, rates: RatesByAssetAddress) => {
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
      session: {
        data: { isOnline },
      },
    } = getState();

    if (isFetching || !isOnline) return;

    dispatch(setIsFetchingRatesAction(true));

    const assetsBalancesPerAccount = assetsBalancesPerAccountSelector(getState());
    const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());

    // combine assets balances from all accounts
    const assetsByAddressPerChain = Object.keys(CHAIN).reduce((combinedAssetsByAddressPerChain, chainKey) => {
      const chain = CHAIN[chainKey];

      const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];

      const chainAccountsAssetsByAddress = Object.keys(assetsBalancesPerAccount).reduce(
        (combinedAssetsByAddress, accountId) => {
          const accountAssetsBalances = assetsBalancesPerAccount[accountId] ?? {};
          const accountWalletAssetsBalances = accountAssetsBalances[chain]?.wallet ?? {};

          const assetsByAddress = mapWalletAssetsBalancesIntoAssetsByAddress(
            accountWalletAssetsBalances,
            chainSupportedAssets,
          );

          // $FlowFixMe
          return { ...combinedAssetsByAddress, ...assetsByAddress };
        },
        {},
      );

      // $FlowFixMe
      return { ...combinedAssetsByAddressPerChain, [chain]: chainAccountsAssetsByAddress };
    }, {});

    Object.keys(assetsByAddressPerChain).map(async (chain) => {
      const chainAssetsByAddress = assetsByAddressPerChain[chain] ?? {};
      try {
        await getExchangeRates(chain, getAssetsAsList(chainAssetsByAddress), async (rates) => {
          if (rates) await dispatch(updateRatesAction(chain, rates));
          dispatch(setIsFetchingRatesAction(false));
        });
      } catch (error) {
        reportErrorLog('fetchAssetsRatesAction failed', { error, chain, chainAssetsByAddress });
      }
    });

    dispatch(setIsFetchingRatesAction(false));
  };
};

export const fetchSingleChainAssetRatesAction = (chain: Chain, asset: Object) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      rates: { isFetching },
      session: {
        data: { isOnline },
      },
    } = getState();

    if (isFetching || !isOnline) return;

    dispatch(setIsFetchingRatesAction(true));

    try {
      await getExchangeRates(chain, [asset], async (rates) => {
        if (isEmpty(rates)) {
          dispatch(setIsFetchingRatesAction(false));
        } else {
          dispatch(setIsFetchingRatesAction(false));
          await dispatch(updateRatesAction(chain, rates));
        }
      });
    } catch (error) {
      reportErrorLog('fetchAssetsRatesAction failed', { error, chain, asset });
    }

    dispatch(setIsFetchingRatesAction(false));
  };
};
