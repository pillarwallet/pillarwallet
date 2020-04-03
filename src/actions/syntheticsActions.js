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
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

// components
import Toast from 'components/Toast';

// constants
import { PLR } from 'constants/assetsConstants';
import {
  SET_AVAILABLE_SYNTHETIC_ASSETS,
  SET_SYNTHETIC_ASSETS_FETCHING,
} from 'constants/syntheticsConstants';

// utils, services
import { getAssetData, getAssetsAsList } from 'utils/assets';
import syntheticsService from 'services/synthetics';
import { parseNumber, reportLog } from 'utils/common';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// models, types
import type { SyntheticAsset } from 'models/Asset';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const initSyntheticsServiceAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { oAuthTokens: { data: { accessToken } } } = getState();
    if (!accessToken) {
      Toast.show({
        message: 'Cannot initialize synthetics service',
        type: 'warning',
        autoClose: false,
      });
      return;
    }
    syntheticsService.init({ accessToken });
  };
};

export const commitSyntheticsTransaction = (transactionId: string, paymentHash: string) => {
  return (dispatch: Dispatch) => {
    dispatch(initSyntheticsServiceAction());
    syntheticsService
      .commitTransaction(transactionId, paymentHash)
      .catch(() => {
        const message = 'Failed to complete synthetic asset transaction';
        reportLog(message, { transactionId, paymentHash });
        Toast.show({
          message,
          type: 'warning',
          autoClose: false,
        });
      });
  };
};

export const fetchAvailableSyntheticAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_SYNTHETIC_ASSETS_FETCHING, payload: true });

    dispatch(initSyntheticsServiceAction());

    const {
      paymentNetwork: { availableStake },
      assets: { supportedAssets },
    } = getState();

    const accountAssets = accountAssetsSelector(getState());
    const assetsData = getAssetsAsList(accountAssets);

    const result = await syntheticsService.getDataFromLiquidityPool().catch(() => []);
    const syntheticAssets = get(result, 'output.liquidityPools', []);
    const syntheticExchangeRates = get(result, 'output.rates', []);

    const stakedPLR = parseNumber(availableStake);

    // PLR is default available
    const defaultAvailableSyntheticAssets = [{
      ...getAssetData(assetsData, supportedAssets, PLR),
      availableBalance: stakedPLR,
      exchangeRate: 1,
    }];

    const availableAssets: SyntheticAsset = syntheticAssets
      .reduce((availableList, syntheticAsset) => {
        const assetSymbol = get(syntheticAsset, 'token.symbol');
        const assetData = getAssetData(assetsData, supportedAssets, assetSymbol);
        const syntheticBalanceInPool = Number(get(syntheticAsset, 'value', 0));
        const assetExchangeRate = syntheticExchangeRates.find(({ from }) => from === assetSymbol);
        if (!isEmpty(assetData) && !isEmpty(assetExchangeRate)) {
          /**
           * calculate available balance according to how much PLR user has staked
           * and how much of synthetic asset is available in pool
           * i. e. if user has staked more than available in pool then max available amount is what's in the pool
           * otherwise max available amount is according toi how much user has staked
           */
          const { rate: exchangeRate } = assetExchangeRate;
          const syntheticBalanceByStaked = stakedPLR / exchangeRate;
          const availableBalance = syntheticBalanceInPool < syntheticBalanceByStaked
            ? syntheticBalanceInPool
            : syntheticBalanceByStaked;

          availableList.push({
            ...assetData,
            availableBalance,
            exchangeRate,
          });
        }
        return availableList;
      }, defaultAvailableSyntheticAssets)
      .filter(({ exchangeRate = 0 }) => exchangeRate !== 0);


    dispatch({ type: SET_AVAILABLE_SYNTHETIC_ASSETS, payload: availableAssets });
  };
};
