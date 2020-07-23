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
import { COLLECTIBLES } from 'constants/assetsConstants';
import {
  SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
  SET_KEY_BASED_ASSETS_TO_TRANSFER,
  SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
} from 'constants/keyBasedAssetTransferConstants';

// actions
import { getAllOwnedAssets } from 'actions/assetsActions';
import { collectibleFromResponse } from 'actions/collectiblesActions';

// utils
import { getAssetsAsList, transformBalancesToObject } from 'utils/assets';
import { reportLog } from 'utils/common';

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Collectible } from 'models/Collectible';
import type { Asset } from 'models/Asset';


export const removeKeyBasedAssetToTransferAction = (asset: Asset | Collectible) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();

    // filter out matching
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.filter(({ asset: transferAssetData }) => {
      if (transferAssetData?.tokenType === COLLECTIBLES) {
        return transferAssetData?.id !== asset?.id && transferAssetData?.contractAddress !== asset?.contractAddress;
      }
      return transferAssetData?.symbol !== asset.symbol;
    });

    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

export const addKeyBasedAssetToTransferAction = (asset: Asset | Collectible) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.concat({ asset });
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

export const fetchAvailableBalancesToTransferAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      wallet: { data: { address: keyBasedWalletAddress } },
      assets: { supportedAssets },
    } = getState();
    dispatch({ type: SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER });

    // fetch key based assets
    const ownedAssets = await getAllOwnedAssets(api, keyBasedWalletAddress, supportedAssets);
    const availableBalances = await api.fetchBalances({
      address: keyBasedWalletAddress,
      assets: getAssetsAsList(ownedAssets),
    });

    dispatch({
      type: SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
      payload: transformBalancesToObject(availableBalances),
    });
  };
};

export const fetchAvailableCollectiblesToTransferAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const { wallet: { data: { address: keyBasedWalletAddress } } } = getState();

    dispatch({ type: SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER });

    let availableCollectibles = [];

    const fetchedCollectibles = await api.fetchCollectibles(keyBasedWalletAddress);
    if (fetchedCollectibles.error || !fetchedCollectibles.assets) {
      reportLog('Failed to fetch key based wallet collectibles', { requestResult: fetchedCollectibles });
    } else {
      availableCollectibles = fetchedCollectibles.assets.map(collectibleFromResponse);
    }

    dispatch({ type: SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER, payload: availableCollectibles });
  };
};
