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
// actions
import { saveDbAction } from 'actions/dbActions';

// services
import aaveService from 'services/aave';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// utils
import { getAssetData, getAssetsAsList } from 'utils/assets';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';

// constants
import {
  SET_ASSETS_TO_DEPOSIT,
  SET_DEPOSITED_ASSETS,
  SET_FETCHING_ASSETS_TO_DEPOSIT,
  SET_FETCHING_DEPOSITED_ASSETS,
} from 'constants/lendingConstants';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { DepositedAsset } from 'models/Asset';


export const fetchAssetsToDepositAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { lending: { isFetchingAssetsToDeposit } } = getState();
    if (isFetchingAssetsToDeposit) return;
    dispatch({ type: SET_FETCHING_ASSETS_TO_DEPOSIT });
    const { assets: { supportedAssets } } = getState();
    const currentAccountAssets = accountAssetsSelector(getState());
    const assets = await aaveService.getAssetsToDeposit(getAssetsAsList(currentAccountAssets), supportedAssets);
    dispatch({ type: SET_ASSETS_TO_DEPOSIT, payload: assets });
  };
};

export const setDepositedAssetsAction = (depositedAssets: DepositedAsset[]) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_DEPOSITED_ASSETS, payload: depositedAssets });
    dispatch(saveDbAction('lending', { depositedAssets }));
  };
}

export const fetchDepositedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      assets: { supportedAssets },
      accounts: { data: accounts },
      lending: { isFetchingDepositedAssets },
    } = getState();
    if (isFetchingDepositedAssets) return;
    dispatch({ type: SET_FETCHING_DEPOSITED_ASSETS });
    const currentAccountAssets = accountAssetsSelector(getState());
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const depositedAssets = await aaveService.getAccountDepositedAssets(
      getAccountAddress(smartWalletAccount),
      getAssetsAsList(currentAccountAssets),
      supportedAssets,
    );
    dispatch(setDepositedAssetsAction(depositedAssets));
  };
};

export const fetchDepositedAssetAction = (symbol: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_FETCHING_DEPOSITED_ASSETS });
    const {
      assets: { supportedAssets },
      accounts: { data: accounts },
      lending: { depositedAssets },
    } = getState();
    const currentAccountAssets = accountAssetsSelector(getState());
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const asset = getAssetData(getAssetsAsList(currentAccountAssets), supportedAssets, symbol);
    const accountAddress = getAccountAddress(smartWalletAccount);
    const updatedDepositedAsset = await aaveService.fetchAccountDepositedAsset(accountAddress, asset);
    const updatedDepositedAssets = depositedAssets.reduce((
      currentList,
      depositedAsset,
      depositedAssetIndex,
    ) => {
      if (updatedDepositedAsset.symbol === depositedAsset.symbol) {
        currentList[depositedAssetIndex] = updatedDepositedAsset;
      }
      return currentList;
    }, depositedAssets);
    dispatch(setDepositedAssetsAction(updatedDepositedAssets));
  };
};
