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

// actions
import { saveDbAction } from 'actions/dbActions';

// services
import aaveService from 'services/aave';
import smartWalletService from 'services/smartWallet';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// utils
import { getAssetData, getAssetsAsList } from 'utils/assets';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import { getAaveDepositTransactions, getAaveWithdrawTransaction } from 'utils/aave';

// constants
import {
  SET_LENDING_ASSETS_TO_DEPOSIT,
  SET_LENDING_DEPOSITED_ASSETS,
  SET_FETCHING_LENDING_ASSETS_TO_DEPOSIT,
  SET_FETCHING_LENDING_DEPOSITED_ASSETS,
  SET_CALCULATING_LENDING_DEPOSIT_TRANSACTION_ESTIMATE,
  SET_LENDING_DEPOSIT_TRANSACTION_ESTIMATE,
  SET_CALCULATING_LENDING_WITHDRAW_TRANSACTION_ESTIMATE,
  SET_LENDING_WITHDRAW_TRANSACTION_ESTIMATE,
} from 'constants/lendingConstants';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { AssetToDeposit, DepositedAsset } from 'models/Asset';
import type { AccountTransaction } from 'services/smartWallet';


export const fetchAssetsToDepositAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { lending: { isFetchingAssetsToDeposit } } = getState();
    if (isFetchingAssetsToDeposit) return;
    dispatch({ type: SET_FETCHING_LENDING_ASSETS_TO_DEPOSIT });

    const { assets: { supportedAssets } } = getState();
    const currentAccountAssets = accountAssetsSelector(getState());
    const assets = await aaveService.getAssetsToDeposit(getAssetsAsList(currentAccountAssets), supportedAssets);
    dispatch({ type: SET_LENDING_ASSETS_TO_DEPOSIT, payload: assets });
  };
};

export const setDepositedAssetsAction = (depositedAssets: DepositedAsset[]) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_LENDING_DEPOSITED_ASSETS, payload: depositedAssets });
    const forceSave = isEmpty(depositedAssets); // force write empty if not fetched (might be withdrawn)
    dispatch(saveDbAction('lending', { depositedAssets }, forceSave));
  };
};

export const fetchDepositedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      assets: { supportedAssets },
      accounts: { data: accounts },
      lending: { isFetchingDepositedAssets },
    } = getState();

    const currentAccountAssets = accountAssetsSelector(getState());
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    if (isFetchingDepositedAssets) return;
    dispatch({ type: SET_FETCHING_LENDING_DEPOSITED_ASSETS });

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
    const {
      assets: { supportedAssets },
      accounts: { data: accounts },
      lending: { depositedAssets, isFetchingDepositedAssets },
    } = getState();
    const currentAccountAssets = accountAssetsSelector(getState());
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    if (isFetchingDepositedAssets) return;
    dispatch({ type: SET_FETCHING_LENDING_DEPOSITED_ASSETS });

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

export const calculateLendingDepositTransactionEstimateAction = (
  amount: number,
  asset: AssetToDeposit,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_CALCULATING_LENDING_DEPOSIT_TRANSACTION_ESTIMATE });

    // may include approve transaction
    const aaveDepositNeededTransactions = await getAaveDepositTransactions(
      getAccountAddress(smartWalletAccount),
      amount,
      asset,
    );

    const estimateTransactions = aaveDepositNeededTransactions.map(({
      to: recipient,
      amount: value,
      data,
    }) => ({ recipient, value, data }));

    const estimateTransaction: AccountTransaction = {
      ...estimateTransactions[0],
      sequentialTransactions: estimateTransactions.slice(1), // exclude first, take rest if exist
    };

    const estimate = await smartWalletService
      .estimateAccountTransaction(estimateTransaction)
      .catch(() => null);

    dispatch({ type: SET_LENDING_DEPOSIT_TRANSACTION_ESTIMATE, payload: estimate });
  };
};

export const calculateLendingWithdrawTransactionEstimateAction = (
  amount: number,
  depositedAsset: DepositedAsset,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_CALCULATING_LENDING_WITHDRAW_TRANSACTION_ESTIMATE });

    // may include approve transaction
    const { to: recipient, amount: value, data } = await getAaveWithdrawTransaction(
      getAccountAddress(smartWalletAccount),
      amount,
      depositedAsset,
    );

    const estimate = await smartWalletService
      .estimateAccountTransaction({ recipient, value, data })
      .catch(() => null);

    dispatch({ type: SET_LENDING_WITHDRAW_TRANSACTION_ESTIMATE, payload: estimate });
  };
};
