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
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
} from 'constants/walletConstants';
import SmartWalletService from 'services/smartWallet';
import {
  addNewAccountAction,
  setActiveAccountAction,
} from 'actions/accountsActions';
import type { SmartWalletAccount } from 'models/SmartWalletAccount';

let smartWalletService: SmartWalletService;
export const initSmartWalletSdkAction = (wallet: Object) => {
  return async (dispatch: Function) => {
    smartWalletService = new SmartWalletService();
    await smartWalletService.init(wallet.privateKey);
    dispatch({
      type: SET_SMART_WALLET_SDK_INIT,
      payload: true,
    });
  };
};

export const getSmartWalletAccountsAction = () => {
  return async (dispatch: Function) => {
    // TODO: Ensure the smartWalletService is initialized
    const accounts = await smartWalletService.getAccounts();
    dispatch({
      type: SET_SMART_WALLET_ACCOUNTS,
      payload: accounts,
    });
    const newAccountsPromises = accounts.map(
      async account => dispatch(addNewAccountAction(account.address, account)),
    );
    return Promise.all(newAccountsPromises);
  };
};

export const connectSmartWalletAccountAction = (account: SmartWalletAccount) => {
  return async (dispatch: Function) => {
    // TODO: Ensure the smartWalletService is initialized
    const connectedAccount = await smartWalletService.connectAccount(account.address);
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      payload: connectedAccount,
    });
  };
};

export const deploySmartWalletAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        connectedAccount: {
          address: accountAddress,
          state: accountState,
        },
      },
    } = getState();
    dispatch(setActiveAccountAction(accountAddress));
    if (accountState.toLowerCase() === 'deployed') {
      console.log('deploySmartWalletAction account is already deployed!');
      return;
    }
    const deployTxHash = await smartWalletService.deploy();
    console.log('deploySmartWalletAction deployTxHash: ', deployTxHash);
    // update accounts info
    dispatch(getSmartWalletAccountsAction());
    const account = await smartWalletService.fetchConnectedAccount();
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      account,
    });
  };
};

export const upgradeToSmartWalletAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        sdkInitialized,
      },
    } = getState();
    if (!sdkInitialized) {
      // TODO: sdk not initialized error
      console.log('sdk not initialized');
      return;
    }
    await dispatch(getSmartWalletAccountsAction());
    const {
      smartWallet: {
        accounts,
      },
    } = getState();
    if (!accounts.length) {
      // TODO: sdk accounts failed error
      console.log('no sdk accounts');
      return;
    }
    await dispatch(connectSmartWalletAccountAction(accounts[0]));
    // TODO: make transactions to smart wallet account address before deploy
    //  as balance check will fail during deploy if balance is 0
    // dispatch(deploySmartWalletAction());
  };
};

