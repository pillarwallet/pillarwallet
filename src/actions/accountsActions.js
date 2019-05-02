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

import {
  ADD_ACCOUNT,
  UPDATE_ACCOUNTS,
  ACCOUNT_TYPES,
} from 'constants/accountsConstants';
import Storage from 'services/storage';
import { saveDbAction } from 'actions/dbActions';

const storage = Storage.getInstance('db');

export const initDefaultAccountAction = (walletAddress: string) => {
  return async (dispatch: Function, getState: Function) => { // eslint-disable-line
    const keyBasedAccount = {
      id: walletAddress,
      type: ACCOUNT_TYPES.KEY_BASED,
      isActive: true,
    };
    dispatch({
      type: ADD_ACCOUNT,
      payload: keyBasedAccount,
    });

    /*
     * Data migration
     */

    // balances

    dispatch(saveDbAction('accounts', { accounts: [keyBasedAccount] }, true));
  };
};

export const addNewAccountAction = (accountAddress: string, accountExtra?: Object = {}) => {
  return async (dispatch: Function, getState: Function) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = {
      id: accountAddress,
      type: ACCOUNT_TYPES.SMART_WALLET,
      extra: accountExtra,
      isActive: false,
    };
    const updatedAccounts = accounts.filter(account => account.id !== accountAddress);
    updatedAccounts.push(smartWalletAccount);
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const setActiveAccountAction = (walletAddress: string) => {
  return async (dispatch: Function) => {
    const { accounts: existingAccounts = [] } = await storage.get('accounts');
    const account = existingAccounts.find(acc => acc.id === walletAddress);
    if (!account) {
      // TODO: account not found in storage
      console.log('setActiveAccountAction account not found by address: ', walletAddress);
      return;
    }
    const accounts = existingAccounts.map(acc => ({ ...acc, isActive: acc.id === walletAddress }));
    console.log('setActiveAccountAction accounts: ', accounts);
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: accounts,
    });
    await dispatch(saveDbAction('accounts', { accounts }, true));
  };
};
