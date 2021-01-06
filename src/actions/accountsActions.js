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
import { UPDATE_ACCOUNTS, CHANGING_ACCOUNT } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

// actions
import { checkForMissedAssetsAction, fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';

// utils
import { reportErrorLog } from 'utils/common';

// types
import type { AccountExtra, AccountTypes } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const addAccountAction = (
  accountAddress: string,
  type: AccountTypes,
  accountExtra?: AccountExtra,
  backendAccounts: Object[] = [],
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = {
      id: accountAddress,
      type,
      extra: accountExtra,
      isActive: false,
      walletId: '',
    };

    const existingAccount = accounts.find(account => account.id.toLowerCase() === accountAddress.toLowerCase());
    const updatedAccounts = accounts.filter(account => account.id.toLowerCase() !== accountAddress.toLowerCase());
    const backendAccount = backendAccounts.find(({ ethAddress }) =>
      ethAddress.toLowerCase() === accountAddress.toLowerCase());

    if (backendAccount) {
      smartWalletAccount.walletId = backendAccount.id;
    }

    if (existingAccount && backendAccount && !existingAccount.walletId) {
      existingAccount.walletId = backendAccount.id;
    }

    if (existingAccount) {
      updatedAccounts.push({ ...existingAccount, extra: accountExtra });
    } else {
      updatedAccounts.push(smartWalletAccount);
    }

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const removeAccountAction = (accountAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const updatedAccounts = accounts.filter(account => account.id.toLowerCase() !== accountAddress.toLowerCase());
    if (accounts.length === updatedAccounts.length) {
      return;
    }
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const setActiveAccountAction = (accountId: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      reportErrorLog('setActiveAccountAction failed: no account', { accounts, accountId });
      return;
    }

    const updatedAccounts = accounts.map(acc => ({ ...acc, isActive: acc.id === accountId }));

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });

    dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const switchAccountAction = (accountId: string) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: CHANGING_ACCOUNT, payload: true });

    dispatch(setActiveAccountAction(accountId));
    dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
    dispatch(fetchAssetsBalancesAction());
    dispatch(fetchCollectiblesAction());
    dispatch(fetchTransactionsHistoryAction());
    dispatch(checkForMissedAssetsAction());

    dispatch({ type: CHANGING_ACCOUNT, payload: false });
  };
};
