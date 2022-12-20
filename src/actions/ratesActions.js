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
import { findAssetByAddress, getAssetsAsList, mapWalletAssetsBalancesIntoAssetsByAddress } from 'utils/assets';
import { reportErrorLog, logBreadcrumb } from 'utils/common';

// selectors
import { supportedAssetsPerChainSelector } from 'selectors';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Chain } from 'models/Chain';
import type { RatesByAssetAddress } from 'models/Rates';

// actions
import { saveDbAction } from './dbActions';

const allSettled = require('promise.allsettled');

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

    const promiseRequest = (chain) => {
      return new Promise(() => {
        (async () => {
          const chainAssetsByAddress = assetsByAddressPerChain[chain] ?? {};
          try {
            const rates = await getExchangeRates(chain, getAssetsAsList(chainAssetsByAddress));
            await dispatch(updateRatesAction(chain, rates));
          } catch (error) {
            reportErrorLog('fetchAssetsRatesAction failed', { error, chain, chainAssetsByAddress });
          }
        })();
      });
    };

    const promises = Object.keys(assetsByAddressPerChain).map(async (chain) => promiseRequest(chain));

    allSettled(promises);

    allSettled.shim();

    dispatch(setIsFetchingRatesAction(false));
  };
};

export const fetchSingleChainAssetRatesAction = (chain: Chain, assetAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      rates: { isFetching },
      session: {
        data: { isOnline },
      },
    } = getState();

    if (isFetching || !isOnline) return;

    dispatch(setIsFetchingRatesAction(true));

    const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());
    const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];

    const asset = findAssetByAddress(chainSupportedAssets, assetAddress);
    if (!asset) {
      dispatch(setIsFetchingRatesAction(false));
      logBreadcrumb('fetchSingleChainAssetRatesAction', 'failed: cannot find asset', { assetAddress });
      return;
    }

    const promiseRequest = () => {
      return new Promise(() => {
        (async () => {
          try {
            const rates = await getExchangeRates(chain, [asset]);
            if (isEmpty(rates)) {
              dispatch(setIsFetchingRatesAction(false));
              return;
            }
            await dispatch(updateRatesAction(chain, rates));
          } catch (error) {
            reportErrorLog('fetchAssetsRatesAction failed', { error, chain, asset });
          }
        })();
      });
    };

    allSettled([promiseRequest()]);

    allSettled.shim();

    dispatch(setIsFetchingRatesAction(false));
  };
};
