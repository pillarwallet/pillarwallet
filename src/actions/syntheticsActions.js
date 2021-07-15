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
import { getPlrAddressForChain } from 'configs/assetsConfig';

// constants
import {
  SET_AVAILABLE_SYNTHETIC_ASSETS,
  SET_SYNTHETIC_ASSETS_FETCHING,
} from 'constants/syntheticsConstants';
import { CHAIN } from 'constants/chainConstants';

// utils, services
import { findAssetByAddress } from 'utils/assets';
import { parseNumber } from 'utils/common';

// selectors
import { ethereumSupportedAssetsSelector } from 'selectors/assets';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const fetchAvailableSyntheticAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_SYNTHETIC_ASSETS_FETCHING, payload: true });

    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    let defaultAvailableSyntheticAssets = [];

    // PLR is default available, synthetic assets are Ethereum mainnet only
    const plrAsset = findAssetByAddress(supportedAssets, getPlrAddressForChain(CHAIN.ETHEREUM));
    if (plrAsset) {
      const stakedPLR = parseNumber(getState().paymentNetwork?.availableStake ?? 0);

      defaultAvailableSyntheticAssets = [
        ...defaultAvailableSyntheticAssets,
        {
          ...plrAsset,
          availableBalance: stakedPLR,
          exchangeRate: 1,
        },
      ];
    }

    dispatch({ type: SET_AVAILABLE_SYNTHETIC_ASSETS, payload: defaultAvailableSyntheticAssets });
  };
};
