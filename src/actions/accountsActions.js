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

// import { saveDbAction } from 'actions/dbActions';
import { ADD_ACCOUNT, ACCOUNT_TYPES } from 'constants/accountConstants';
import Storage from 'services/storage';
import { saveDbAction } from './dbActions';

const storage = Storage.getInstance('db');

export const initDefaultAccount = (walletAddress: string) => {
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

    // dispatch(saveDbAction('accounts', { accounts: [keyBasedAccount] }, true));
  };
};

export const addNewAccountAction = (walletAddress: string, accountExtra?: Object = {}) => {
  return async (dispatch: Function) => { // eslint-disable-line
    const { accounts: existingAccounts = [] } = await storage.get('accounts');
    const smartWalletAccount = {
      id: walletAddress,
      type: ACCOUNT_TYPES.SMART_WALLET,
      extra: accountExtra,
      isActive: false,
    };
    const accounts = existingAccounts.filter(account => account.id !== walletAddress);
    accounts.push(smartWalletAccount);
    dispatch({
      type: ADD_ACCOUNT,
      payload: smartWalletAccount,
    });
    console.log('addNewAccountAction accounts: ', accounts);
    await dispatch(saveDbAction('accounts', { accounts }, true));
  };
};
